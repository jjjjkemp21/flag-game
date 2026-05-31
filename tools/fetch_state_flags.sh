#!/bin/bash
# One-shot fetcher for the 50 state + DC flag SVGs from Wikimedia Commons.
# Re-run only if a flag image is replaced upstream.
#
# Sources every file through Wikimedia's Special:FilePath redirect so the
# download URL is the canonical one regardless of which content-addressed
# bucket the file currently lives in. Validates the response is an SVG.

set -euo pipefail

DEST="public/assets/state-flags"
mkdir -p "$DEST"

# Postal code → Commons article title used in `Flag of <Title>.svg`.
# A handful of states use a disambiguated title on Commons.
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
  title=${TITLES[$code]}
  url="https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_${title}.svg"
  out="$DEST/$code.svg"
  printf "  %s -> %s ... " "$code" "$title"
  http_code=$(curl -sSL -A "FlagGame-asset-fetcher/1.0" -o "$out" -w "%{http_code}" "$url" || echo "000")
  if [ "$http_code" != "200" ]; then
    echo "HTTP $http_code (failed)"
    fail+=("$code")
    rm -f "$out"
    continue
  fi
  # Validate it's actually SVG; some redirects to deleted/renamed files return
  # an HTML error page that's still 200.
  first=$(head -c 100 "$out")
  if ! grep -q "<svg\|<?xml" <<<"$first"; then
    echo "not SVG (failed)"
    fail+=("$code")
    rm -f "$out"
    continue
  fi
  size=$(wc -c < "$out")
  echo "OK ${size}b"
done

if [ ${#fail[@]} -gt 0 ]; then
  echo
  echo "Failed: ${fail[*]}"
  exit 1
fi
echo
echo "All 51 flags downloaded into $DEST."
