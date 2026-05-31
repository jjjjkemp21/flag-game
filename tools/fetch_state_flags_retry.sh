#!/bin/bash
# Retry-only fetch: download flags missing from public/assets/state-flags,
# with a polite 1.2s gap between requests so Wikimedia doesn't rate-limit us
# again. Re-runnable — skips anything already on disk.

set -euo pipefail

DEST="public/assets/state-flags"
mkdir -p "$DEST"

declare -A TITLES=(
  [al]="Alabama"
  [ak]="Alaska"
  [az]="Arizona"
  [ar]="Arkansas"
  [ca]="California"
  [co]="Colorado"
  [ct]="Connecticut"
  [de]="Delaware"
  [fl]="Florida"
  [ga]="Georgia_(U.S._state)"
  [hi]="Hawaii"
  [id]="Idaho"
  [il]="Illinois"
  [in]="Indiana"
  [ia]="Iowa"
  [ks]="Kansas"
  [ky]="Kentucky"
  [la]="Louisiana"
  [me]="Maine"
  [md]="Maryland"
  [ma]="Massachusetts"
  [mi]="Michigan"
  [mn]="Minnesota"
  [ms]="Mississippi"
  [mo]="Missouri"
  [mt]="Montana"
  [ne]="Nebraska"
  [nv]="Nevada"
  [nh]="New_Hampshire"
  [nj]="New_Jersey"
  [nm]="New_Mexico"
  [ny]="New_York"
  [nc]="North_Carolina"
  [nd]="North_Dakota"
  [oh]="Ohio"
  [ok]="Oklahoma"
  [or]="Oregon"
  [pa]="Pennsylvania"
  [ri]="Rhode_Island"
  [sc]="South_Carolina"
  [sd]="South_Dakota"
  [tn]="Tennessee"
  [tx]="Texas"
  [ut]="Utah"
  [vt]="Vermont"
  [va]="Virginia"
  [wa]="Washington"
  [wv]="West_Virginia"
  [wi]="Wisconsin"
  [wy]="Wyoming"
  [dc]="the_District_of_Columbia"
)

fail=()
for code in "${!TITLES[@]}"; do
  out="$DEST/$code.svg"
  if [ -s "$out" ] && grep -q "<svg\|<?xml" <(head -c 100 "$out"); then
    continue
  fi
  title=${TITLES[$code]}
  url="https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_${title}.svg"
  printf "  %s -> %s ... " "$code" "$title"
  attempt=1
  while [ $attempt -le 4 ]; do
    http_code=$(curl -sSL -A "FlagGame-asset-fetcher/1.0" -o "$out" -w "%{http_code}" "$url" || echo "000")
    if [ "$http_code" = "200" ] && grep -q "<svg\|<?xml" <(head -c 100 "$out"); then
      size=$(wc -c < "$out")
      echo "OK ${size}b"
      break
    fi
    rm -f "$out"
    if [ "$http_code" = "429" ]; then
      sleep $((attempt * 4))
      attempt=$((attempt + 1))
      continue
    fi
    echo "HTTP $http_code (giving up)"
    fail+=("$code")
    break
  done
  if [ $attempt -gt 4 ]; then
    echo "HTTP 429 after 4 retries (giving up)"
    fail+=("$code")
  fi
  sleep 1.2
done

echo
if [ ${#fail[@]} -gt 0 ]; then
  echo "Still failed: ${fail[*]}"
  exit 1
fi
echo "All states covered. Total files: $(ls "$DEST" | wc -l)"
