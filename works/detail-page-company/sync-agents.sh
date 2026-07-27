#!/usr/bin/env bash
# 패키지의 에이전트 지침을 이미 임포트된 회사의 managed instructions 로 다시 밀어넣는다.
#
# 왜 필요한가
#   회사 임포트는 처음 한 번뿐이다. 그 뒤 works/detail-page-company/agents/*/AGENTS.md 를
#   고쳐도 살아 있는 에이전트는 예전 지침을 계속 읽는다. 이 스크립트가 그 간극을 메운다.
#
# 하는 일 (파이프라인 6인만 대상 — Page / Founding Engineer 등은 건드리지 않는다)
#   live/AGENTS.md  :=  shared/PREAMBLE.md  +  agents/<slug>/AGENTS.md
#   live/COMPLIANCE.md, PRODUCT.md, CANVAS.md  :=  shared/ 의 최신본
#
# 안전장치
#   · 기존 AGENTS.md 를 .bak-<타임스탬프> 로 백업한다
#   · 기본은 미리보기. 실제 반영은 --apply
#
# 사용
#   ./sync-agents.sh          # 미리보기 (무엇이 바뀌는지 diff 요약)
#   ./sync-agents.sh --apply  # 실제 반영

set -euo pipefail

PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED="$PKG_DIR/shared"
COMPANY_ID="6db3478e-6fb3-4a18-9960-1cd0b0a53fe0"
AGENTS_ROOT="$HOME/.paperclip/instances/default/companies/$COMPANY_ID/agents"

APPLY=false
[ "${1:-}" = "--apply" ] && APPLY=true

# slug → 에이전트 UUID 접두사
declare -A TARGETS=(
  ["orchestrator"]="468d0e99"
  ["analyst"]="b9f6beef"
  ["strategist"]="700050c7"
  ["designer"]="541f365a"
  ["builder"]="fc058caa"
  ["qa"]="31805146"
)

[ -d "$AGENTS_ROOT" ] || { echo "!! 회사 디렉터리가 없습니다: $AGENTS_ROOT"; exit 1; }

echo "대상: $AGENTS_ROOT"
$APPLY || echo "(미리보기 — 실제 반영은 --apply)"
echo

for slug in "${!TARGETS[@]}"; do
  src="$PKG_DIR/agents/$slug/AGENTS.md"
  prefix="${TARGETS[$slug]}"

  if [ ! -f "$src" ]; then
    echo "  건너뜀  $slug — 패키지에 AGENTS.md 없음"
    continue
  fi

  dir="$(find "$AGENTS_ROOT" -maxdepth 1 -type d -name "${prefix}*" | head -1)"
  if [ -z "$dir" ]; then
    echo "  건너뜀  $slug — 살아있는 에이전트 디렉터리 없음 ($prefix)"
    continue
  fi

  inst="$dir/instructions"
  entry="$inst/AGENTS.md"
  mkdir -p "$inst"

  new="$(mktemp)"
  cat "$SHARED/PREAMBLE.md" "$src" > "$new"

  if [ -f "$entry" ] && cmp -s "$new" "$entry"; then
    echo "  동일    $slug"
    rm -f "$new"
    continue
  fi

  if ! $APPLY; then
    old_lines=$([ -f "$entry" ] && wc -l < "$entry" || echo 0)
    new_lines=$(wc -l < "$new")
    echo "  반영예정 $slug  ($old_lines줄 → $new_lines줄)  $inst"
    rm -f "$new"
    continue
  fi

  [ -f "$entry" ] && cp "$entry" "$entry.bak-$(date +%Y%m%d%H%M%S)"
  mv "$new" "$entry"
  cp "$SHARED/COMPLIANCE.md" "$inst/COMPLIANCE.md"
  cp "$SHARED/PRODUCT.md"    "$inst/PRODUCT.md"
  cp "$SHARED/CANVAS.md"     "$inst/CANVAS.md"
  echo "  반영됨  $slug"
done

echo
if $APPLY; then
  echo "완료. 서버가 다음 실행에서 새 지침을 읽습니다."
  echo "보드 UI 의 에이전트 > Instructions 탭에서 반영 여부를 확인하세요."
else
  echo "미리보기였습니다. 실제 반영하려면: ./sync-agents.sh --apply"
fi
