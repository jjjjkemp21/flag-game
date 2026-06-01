#!/bin/bash
# One-shot fetcher for the 27 LGBTQ+ identity pride-flag SVGs from Wikimedia
# Commons. Each entry below lists candidate filenames in priority order — the
# first one that returns a valid SVG wins. Polite ~1s throttle between hits so
# we don't get rate-limited (Commons starts returning HTTP 429 around 50 req/s
# from a single client).

set -uo pipefail

DEST="public/assets/pride-flags"
mkdir -p "$DEST"

# slug ; Title|Title|Title (URL-encoded titles, no .svg suffix). First hit wins.
read -r -d '' SPEC <<'EOF' || true
rainbow;Gay_Pride_Flag|Rainbow_flag_(LGBT)|Rainbow_flag
progress-pride;Progress_Pride_Flag|LGBTQ%2B_rainbow_flag_Quasar_%22Progress%22_variant
intersex-inclusive-progress-pride;Intersex-inclusive_pride_flag|Intersex_Inclusive_Pride_Flag
gay-men-mlm;Gay_men%27s_pride_flag|New_Gay_Pride_Flag|Gay_male_pride_flag
lesbian;Lesbian_pride_flag_2018|Lesbian_pride_flag|Lesbian_Pride_Flag
bisexual;Bisexual_Pride_Flag|Bi_flag
pansexual;Pansexuality_Flag|Pansexual_flag
transgender;Transgender_Pride_flag
nonbinary;Nonbinary_flag|Non-binary_flag
genderqueer;Genderqueer_flag|Genderqueer_Pride_Flag
genderfluid;Genderfluidity_Pride-Flag|Genderfluid_flag|Genderfluid_Flag
agender;Agender_flag|Agender_Pride_Flag
asexual;Asexual_flag|Asexual_Pride_Flag
aromantic;Aromantic_flag|Aromantic_Pride_Flag
demisexual;Demisexual_flag|Demisexual_Pride_Flag
demiromantic;Demiromantic_Pride_Flag|Demiromantic_flag
intersex;Intersex_flag|Intersex_Pride_Flag
two-spirit;Two-Spirit_flag|Two_Spirit_flag
queer;Queer_flag|Queer_Pride_Flag
polyamory;Polyamory_pride_flag|Polyamory_flag|Polyamorous_flag
omnisexual;Omnisexual_flag|Omnisexual_Pride_Flag
graysexual;Graysexual_Pride_Flag|Gray_asexual_pride_flag|Graysexual_flag|Greysexual_Flag
polysexual;Polysexual_Pride_Flag|Polysexuality_Pride_Flag|Polysexuality_flag
abrosexual;Abrosexual_flag|Abrosexuality_Pride-Flag|Abrosexual_Pride_Flag
bigender;Bigender_Pride_Flag|Bigender_flag
demigender;Demigender_Pride_Flag|Demigender_flag
neutrois;Neutrois_flag|Neutrois_Pride_Flag
EOF

fetch_one() {
  local slug="$1"
  local cands="$2"
  local out="$DEST/$slug.svg"
  if [ -s "$out" ] && head -c 200 "$out" | grep -q "<svg\|<?xml"; then
    echo "  $slug  (already on disk, skipped)"
    return 0
  fi
  IFS='|' read -ra LIST <<<"$cands"
  for title in "${LIST[@]}"; do
    local url="https://commons.wikimedia.org/wiki/Special:FilePath/${title}.svg"
    local http_code
    http_code=$(curl -sSL -A "FlagGame-asset-fetcher/1.0" -o "$out" -w "%{http_code}" "$url" || echo "000")
    if [ "$http_code" = "200" ] && head -c 200 "$out" | grep -q "<svg\|<?xml"; then
      local size
      size=$(wc -c < "$out")
      printf "  %-32s OK (%s, %db)\n" "$slug" "$title" "$size"
      sleep 1
      return 0
    fi
    if [ "$http_code" = "429" ]; then
      printf "  %-32s 429 — backing off 6s\n" "$slug"
      sleep 6
      # retry the SAME title once after the backoff
      http_code=$(curl -sSL -A "FlagGame-asset-fetcher/1.0" -o "$out" -w "%{http_code}" "$url" || echo "000")
      if [ "$http_code" = "200" ] && head -c 200 "$out" | grep -q "<svg\|<?xml"; then
        local size
        size=$(wc -c < "$out")
        printf "  %-32s OK after retry (%s, %db)\n" "$slug" "$title" "$size"
        sleep 1
        return 0
      fi
    fi
    rm -f "$out"
    sleep 1
  done
  printf "  %-32s FAILED (tried: %s)\n" "$slug" "$cands"
  return 1
}

fail=()
while IFS= read -r line; do
  [ -z "$line" ] && continue
  slug=${line%%;*}
  cands=${line#*;}
  fetch_one "$slug" "$cands" || fail+=("$slug")
done <<<"$SPEC"

echo
echo "Got $(ls "$DEST"/*.svg 2>/dev/null | wc -l) of 27 flags."
if [ ${#fail[@]} -gt 0 ]; then
  echo "Failed: ${fail[*]}"
  exit 1
fi
