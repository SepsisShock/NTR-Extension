#!/usr/bin/env bash
# Prints why a change needs every scenario, or nothing when it needs none. Usage: needs-scenarios.sh [base] [head] (origin/main HEAD).
# A change needs them when it adds, deletes or renames a .js file, touches a line that loads modules, or edits
# index.js's Module loader section.
base=${1:-origin/main} head=${2:-HEAD}
git diff --name-only --diff-filter=ADR "$base...$head" -- ':(glob)*.js' | sed 's/^/file added, deleted or renamed: /'
git diff --name-only -G'loadModule\(|import\(|callModule\(|[pP]ageHtml\(|pagePart\(|fillIn\(|LOOK_MODULES|MOD_LABEL' "$base...$head" -- ':(glob)*.js' | sed 's/^/loading line changed: /'
# The Module loader section runs from its heading to the next "// =====" heading, on each side of the diff.
range() { git show "$1:index.js" | awk '/\/\/ ===== Module loader/ { s = NR } s && NR > s && /\/\/ =====/ { print s, NR; exit }'; }
read -r os oe < <(range "$(git merge-base "$base" "$head")")
read -r ns ne < <(range "$head")
git diff -U0 "$base...$head" -- index.js | awk -v os="$os" -v oe="$oe" -v ns="$ns" -v ne="$ne" '
  os != "" && ns != "" && /^@@/ {
    split($2, o, ","); split($3, n, ",")
    o1 = substr(o[1], 2); oc = o[2] == "" ? 1 : o[2]; n1 = substr(n[1], 2); nc = n[2] == "" ? 1 : n[2]
    if ((oc && o1 <= oe && o1 + oc - 1 >= os) || (nc && n1 <= ne && n1 + nc - 1 >= ns)) { print "index.js Module loader section changed"; exit }
  }'
