#!/usr/bin/env bash
# 규제 가드레일을 bio-moa-medical 에이전트들에게 배포한다.
#
# 하는 일
#   각 에이전트의 managed instructions 번들 디렉터리에
#     · COMPLIANCE.md  (광고 심의 가드레일)
#     · PRODUCT.md     (대상 제품 사실)
#     · CANVAS.md      (상세페이지 포맷 계약 — 세로 긴 이미지)
#     · SELLING.md     (장점 극대화 원칙 — 합법 무기고와 강도 규칙)
#   을 복사하고, AGENTS.md 앞에 PREAMBLE(필수 선행 규칙)을 한 번만 삽입한다.
#
# 안전장치
#   · 기존 AGENTS.md 를 .bak-<타임스탬프> 로 백업한다
#   · 이미 PREAMBLE 이 들어간 에이전트는 공유 문서만 갱신한다 (중복 삽입 방지)
#
# 주의
#   이 스크립트는 공유 문서와 PREAMBLE 만 다룬다. 에이전트별 AGENTS.md 본문을
#   패키지 기준으로 다시 맞추려면 ./sync-agents.sh 를 쓴다.
#
# 사용
#   ./apply-compliance.sh          # 미리보기
#   ./apply-compliance.sh --apply  # 실제 적용

set -euo pipefail

PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED="$PKG_DIR/shared"
COMPANY_ID="6db3478e-6fb3-4a18-9960-1cd0b0a53fe0"
AGENTS_ROOT="$HOME/.paperclip/instances/default/companies/$COMPANY_ID/agents"
MARKER="# ⚠️ 필수 선행 규칙"

APPLY=false
[ "${1:-}" = "--apply" ] && APPLY=true

# 상세페이지 파이프라인 담당 에이전트만 대상으로 한다.
# (Reflection Coach / Summarizer 같은 built-in 은 제외)
declare -A TARGETS=(
  ["468d0e99-2e42-45c1-95ab-fb5533cc1153"]="Orchestrator"
  ["fcc31caa"]="Analyst"
  ["700050c7"]="Strategist"
  ["541f365a"]="Designer"
  ["fc058caa"]="Builder"
  ["31805146"]="QA"
  ["747b975d-da64-4165-9e14-001c06cd4538"]="Page"
  ["aeb4996f-60c2-40ed-a0a8-f3f10dcc5346"]="Founding Engineer"
)

for prefix in "${!TARGETS[@]}"; do
  name="${TARGETS[$prefix]}"
  # 짧은 접두사로 실제 디렉터리를 찾는다
  dir="$(find "$AGENTS_ROOT" -maxdepth 1 -type d -name "${prefix}*" | head -1)"

  if [ -z "$dir" ]; then
    echo "  건너뜀  $name — 디렉터리 없음 ($prefix)"
    continue
  fi

  inst="$dir/instructions"
  entry="$inst/AGENTS.md"

  if [ ! -f "$entry" ]; then
    echo "  건너뜀  $name — AGENTS.md 없음"
    continue
  fi

  has_preamble=false
  grep -qF "$MARKER" "$entry" && has_preamble=true

  if ! $APPLY; then
    if $has_preamble; then
      echo "  갱신예정 $name  — 공유 문서만 ($inst)"
    else
      echo "  적용예정 $name  ($inst)"
    fi
    continue
  fi

  cp "$entry" "$entry.bak-$(date +%Y%m%d%H%M%S)"

  # 공유 문서는 항상 최신으로 덮어쓴다 (멱등)
  cp "$SHARED/COMPLIANCE.md" "$inst/COMPLIANCE.md"
  cp "$SHARED/PRODUCT.md"    "$inst/PRODUCT.md"
  cp "$SHARED/CANVAS.md"     "$inst/CANVAS.md"
  cp "$SHARED/SELLING.md"    "$inst/SELLING.md"

  if $has_preamble; then
    echo "  갱신됨  $name  (공유 문서만 — PREAMBLE 은 이미 있음)"
  else
    # PREAMBLE 을 기존 지시문 앞에 붙인다
    tmp="$(mktemp)"
    cat "$SHARED/PREAMBLE.md" "$entry" > "$tmp"
    mv "$tmp" "$entry"
    echo "  적용됨  $name"
  fi
done

echo
if $APPLY; then
  echo "완료. 서버가 다음 하트비트에서 새 지시문을 읽습니다."
  echo "보드 UI 의 에이전트 > Instructions 탭에서 반영 여부를 확인하세요."
else
  echo "미리보기였습니다. 실제 적용하려면: ./apply-compliance.sh --apply"
fi
