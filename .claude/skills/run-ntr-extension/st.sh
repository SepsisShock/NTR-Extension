#!/usr/bin/env bash
# A local SillyTavern with this repo installed as an extension, for running and testing it.
#
#   st.sh setup          clone SillyTavern, install it, first run, save clean data, install the extension
#   st.sh hook           for the session start hook: setup in the background, in cloud sessions, if not done yet
#   st.sh browsers       download Firefox and WebKit for the driver (NTR_BROWSER)
#   st.sh install [ref]  copy the extension into SillyTavern (working tree, or a git ref like origin/main)
#   st.sh start | stop   start in the background (waits until it answers) | stop
#   st.sh reset [ref]    stop, put back the clean data, install the extension (start again afterwards)
#   st.sh lazy on|off    SillyTavern's lazy character loading (restart to apply)
#   st.sh bench <name> [ref|none] [full] [vn] [phone] [cpu=N] [runs=N]
#                        speed test on clean data (see SKILL.md); stops the server when done
#   st.sh bench table <name> [name...]   compare saved results
#
# SillyTavern lives in $ST_DIR (default ~/sillytavern) and answers on http://127.0.0.1:8000. Log: $ST_LOG.
# The other commands wait while a setup is running.
set -euo pipefail

ST_DIR="${ST_DIR:-$HOME/sillytavern}"
ST_LOG="${ST_LOG:-/tmp/sillytavern.log}"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
USER_DIR="$ST_DIR/data/default-user"
EXT_DIR="$USER_DIR/extensions/NTR-Extension"
CLEAN="$ST_DIR/.ntr-clean-data"
PORT=8000
SETUP_LOG="${SETUP_LOG:-/tmp/sillytavern-setup.log}"
LOCK=/tmp/ntr-st-setup.lock

# Waits for a setup that's running (the hook's, in the background) to finish.
wait_setup() {
  exec 9>"$LOCK"
  if ! flock -n 9; then echo "waiting for SillyTavern setup to finish (log: $SETUP_LOG)"; flock 9; fi
  exec 9>&-
}

up() { curl -sf -o /dev/null "http://127.0.0.1:$PORT"; }

start() {
  if up; then echo "SillyTavern is already running"; return; fi
  # Its own session, and none of this shell's output: a leftover writer would keep `$(st.sh start)` or a pipe open.
  # Not holding setup's lock either, or the next command would wait for the server to stop.
  (cd "$ST_DIR" && exec setsid nohup node server.js) > "$ST_LOG" 2>&1 < /dev/null 9>&- &
  local pid=$!
  if ! timeout 120 bash -c "until curl -sf -o /dev/null http://127.0.0.1:$PORT; do sleep 1; done"; then
    kill "$pid" 2>/dev/null || true
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

# The extension's files: manifest.json, every top-level .js, .css and .svg, and the assets folder.
install_ext() {
  local ref="${1:-}"
  rm -rf "$EXT_DIR" && mkdir -p "$EXT_DIR"
  if [ -z "$ref" ]; then
    cp "$REPO"/manifest.json "$REPO"/*.js "$REPO"/*.css "$EXT_DIR"/
    for f in "$REPO"/*.svg; do if [ -e "$f" ]; then cp "$f" "$EXT_DIR"/; fi; done
    if [ -d "$REPO/assets" ]; then cp -r "$REPO/assets" "$EXT_DIR"/; fi
    echo "installed the extension from the working tree"
  else
    git -C "$REPO" ls-tree -r --name-only "$ref" | grep -E '^(manifest\.json|[^/]+\.(js|css|svg)|assets/.+)$' | while read -r f; do
      mkdir -p "$EXT_DIR/$(dirname "$f")"
      git -C "$REPO" show "$ref:$f" > "$EXT_DIR/$f"
    done
    echo "installed the extension from $ref ($(git -C "$REPO" rev-parse --short "$ref"))"
  fi
}

setup() {
  exec 9>"$LOCK"
  if ! flock -n 9; then echo "waiting for the SillyTavern setup already running (log: $SETUP_LOG)"; flock 9; fi
  # Done once is enough, and doing it again would stop a running server. Delete $ST_DIR to start over.
  if [ -d "$CLEAN" ]; then echo "SillyTavern is already set up in $ST_DIR"; return; fi
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

# The session start hook (.claude/settings.json). It returns at once, so the session doesn't wait for it.
hook() {
  [ "${CLAUDE_CODE_REMOTE:-}" = true ] && [ ! -d "$CLEAN" ] || return 0
  setsid nohup bash "${BASH_SOURCE[0]}" setup > "$SETUP_LOG" 2>&1 < /dev/null &
}

# Firefox and WebKit, for the same Playwright as the preinstalled Chromium. Needs cdn.playwright.dev and
# playwright.download.prss.microsoft.com allowed.
browsers() {
  local pw; pw="$(npm root -g)/playwright"
  [ -d "$pw" ] || { echo "no global Playwright in $(npm root -g)"; exit 1; }
  # The installer fetches the exact revisions this Playwright needs and skips what's there.
  node "$pw/cli.js" install --with-deps firefox webkit
}

reset() {
  [ -d "$CLEAN" ] || { echo "no clean data yet: run st.sh setup first"; exit 1; }
  stop
  rm -rf "$USER_DIR" && cp -a "$CLEAN" "$USER_DIR"
  install_ext "${1:-}"
}

lazy() {
  local want
  case "${1:-}" in on) want=true ;; off) want=false ;; *) echo "usage: st.sh lazy on|off"; exit 1 ;; esac
  sed -i -E "s/^(\s*lazyLoadCharacters:).*/\1 $want/" "$ST_DIR/config.yaml"
  grep -E '^\s*lazyLoadCharacters:' "$ST_DIR/config.yaml"
}

bench() {
  local here; here="$(dirname "${BASH_SOURCE[0]}")"
  if [ "${1:-}" = table ]; then shift; node "$here/bench.cjs" table "$@"; return; fi
  local name="${1:-}" ref="" full="" runs=3 flags=()
  [ -n "$name" ] || { echo "usage: st.sh bench <name> [ref|none] [full] [vn] [phone] [cpu=N] [runs=N]"; exit 1; }
  shift
  for a in "$@"; do
    case "$a" in full) full=1 ;; vn) flags+=(--vn) ;; phone) flags+=(--phone) ;; cpu=*) flags+=(--cpu "${a#cpu=}") ;; runs=*) runs="${a#runs=}" ;; *) ref="$a" ;; esac
  done
  if [ "$ref" = none ]; then reset; rm -rf "$EXT_DIR"; echo "no extension installed"; else reset "$ref"; fi
  # The version the runs must find loaded, from the installed manifest.
  if [ "$ref" != none ]; then flags+=(--ntr "$(node -p "require('$EXT_DIR/manifest.json').version")"); fi
  start
  # Stops the server however bench ends: done, a failed step or Ctrl-C.
  trap stop EXIT
  if [ -n "$full" ]; then
    [ "$ref" != none ] || { echo "full needs the extension"; exit 1; }
    # Test images from SillyTavern's own content: its three largest backgrounds for the banner, Seraphina for the foreground.
    local img="${NTR_BENCH:-/tmp/ntr-bench}/img" banners=() f
    rm -rf "$img" && mkdir -p "$img"
    while read -r f; do
      cp "$ST_DIR/default/content/backgrounds/$f" "$img/banner${#banners[@]}.${f##*.}"
      banners+=("$img/banner${#banners[@]}.${f##*.}")
    done < <(ls -S "$ST_DIR/default/content/backgrounds" | grep -iE '\.(png|jpe?g|webp)$' | head -3)
    cp "$ST_DIR/default/content/default_Seraphina.png" "$img/fg.png"
    sed -e "s#@BANNERS@#${banners[*]}#" -e "s#@IMG@#$img#g" "$here/bench-full.txt" | NTR_BROWSER=chromium NTR_PHONE= node "$here/driver.cjs" \
      || { echo "turning on NTR's features failed"; exit 1; }
  fi
  node "$here/bench.cjs" run "$name" --runs "$runs" "${flags[@]}"
}

case "${1:-}" in setup | hook | browsers) ;; *) wait_setup ;; esac
case "${1:-}" in
  setup) setup ;;
  hook) hook ;;
  browsers) browsers ;;
  install) install_ext "${2:-}" ;;
  start) start ;;
  stop) stop ;;
  reset) reset "${2:-}" ;;
  lazy) lazy "${2:-}" ;;
  bench) shift; bench "$@" ;;
  *) sed -n '2,16p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
