#!/usr/bin/env bash
# A local SillyTavern with this repo installed as an extension, for running and testing it.
#
#   st.sh setup          clone SillyTavern, install it, first run, save clean data, install the extension
#   st.sh install [ref]  copy the extension into SillyTavern (working tree, or a git ref like origin/main)
#   st.sh start | stop   start in the background (waits until it answers) | stop
#   st.sh reset [ref]    stop, put back the clean data, install the extension (start again afterwards)
#   st.sh lazy on|off    SillyTavern's lazy character loading (restart to apply)
#
# SillyTavern lives in $ST_DIR (default ~/sillytavern) and answers on http://127.0.0.1:8000. Log: $ST_LOG.
set -euo pipefail

ST_DIR="${ST_DIR:-$HOME/sillytavern}"
ST_LOG="${ST_LOG:-/tmp/sillytavern.log}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
USER_DIR="$ST_DIR/data/default-user"
EXT_DIR="$USER_DIR/extensions/NTR-Extension"
CLEAN="$ST_DIR/.ntr-clean-data"
PORT=8000

up() { curl -sf -o /dev/null "http://127.0.0.1:$PORT"; }

start() {
  if up; then echo "SillyTavern is already running"; return; fi
  # Its own session, and none of this shell's output: a leftover writer would keep `$(st.sh start)` or a pipe open.
  (cd "$ST_DIR" && exec setsid nohup node server.js) > "$ST_LOG" 2>&1 < /dev/null &
  if ! timeout 120 bash -c "until curl -sf -o /dev/null http://127.0.0.1:$PORT; do sleep 1; done"; then
    echo "SillyTavern didn't start; last lines of $ST_LOG:"; tail -20 "$ST_LOG"; exit 1
  fi
  echo "SillyTavern is up at http://127.0.0.1:$PORT"
}

stop() {
  local pids p
  pids="$(lsof -ti:$PORT -sTCP:LISTEN || true)"
  if [ -z "$pids" ]; then echo "SillyTavern isn't running"; return; fi
  kill $pids
  # Wait for the process itself, so its shutdown writes are done before anything touches its data.
  for p in $pids; do timeout 20 bash -c "while kill -0 $p 2>/dev/null; do sleep 0.5; done"; done
  echo "SillyTavern stopped"
}

# The extension's files: manifest.json plus every top-level .js and .css.
install_ext() {
  local ref="${1:-}"
  rm -rf "$EXT_DIR" && mkdir -p "$EXT_DIR"
  if [ -z "$ref" ]; then
    cp "$REPO"/manifest.json "$REPO"/*.js "$REPO"/*.css "$EXT_DIR"/
    echo "installed the extension from the working tree"
  else
    git -C "$REPO" ls-tree --name-only "$ref" | grep -E '^(manifest\.json|[^/]+\.(js|css))$' | while read -r f; do
      git -C "$REPO" show "$ref:$f" > "$EXT_DIR/$f"
    done
    echo "installed the extension from $ref ($(git -C "$REPO" rev-parse --short "$ref"))"
  fi
}

setup() {
  if [ ! -d "$ST_DIR/.git" ]; then
    GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/SillyTavern/SillyTavern "$ST_DIR"
  fi
  (cd "$ST_DIR" && npm ci --no-audit --no-fund --loglevel=error --no-progress --omit=dev)
  # The first start creates config.yaml and data/default-user (with the Seraphina character).
  start && stop
  # Skip the first-run "what's your name" popup: it blocks the page for a headless browser.
  node -e 'const fs=require("fs"),f=process.argv[1],s=JSON.parse(fs.readFileSync(f,"utf8"));s.firstRun=false;fs.writeFileSync(f,JSON.stringify(s,null,4))' "$USER_DIR/settings.json"
  rm -rf "$CLEAN" && cp -a "$USER_DIR" "$CLEAN"
  install_ext
  echo "setup done: SillyTavern $(node -p "require('$ST_DIR/package.json').version") in $ST_DIR"
}

reset() {
  [ -d "$CLEAN" ] || { echo "no clean data yet: run st.sh setup first"; exit 1; }
  stop
  rm -rf "$USER_DIR" && cp -a "$CLEAN" "$USER_DIR"
  install_ext "${1:-}"
}

lazy() {
  local want; case "${1:-}" in on) want=true ;; off) want=false ;; *) echo "usage: st.sh lazy on|off"; exit 1 ;; esac
  sed -i -E "s/^(\s*lazyLoadCharacters:).*/\1 $want/" "$ST_DIR/config.yaml"
  grep -E '^\s*lazyLoadCharacters:' "$ST_DIR/config.yaml"
}

case "${1:-}" in
  setup) setup ;;
  install) install_ext "${2:-}" ;;
  start) start ;;
  stop) stop ;;
  reset) reset "${2:-}" ;;
  lazy) lazy "${2:-}" ;;
  *) sed -n '2,10p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
