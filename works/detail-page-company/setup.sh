#!/usr/bin/env bash
# 상세페이지 스튜디오 — Paperclip 쪽 셋업
#
# 사전 조건
#   PAPERCLIP_BASE_URL   예: http://localhost:3100
#
#   인증: 회사 임포트(--target new)는 **인스턴스 관리자 권한의 보드 사용자**가 필요하다.
#   에이전트 API 키(pcp_...)로는 안 된다 — 서버가 403 "Board access required" 를 낸다.
#   이 스크립트는 CLI 보드 로그인(~/.paperclip/auth.json)을 사용한다.
#   미리 로그인해 두려면:
#     pnpm paperclipai auth login --instance-admin
#   (로그인 안 돼 있으면 아래에서 자동으로 실행한다)
#
# 사용
#   export PAPERCLIP_BASE_URL=http://localhost:3100
#   ./setup.sh
#
# 하는 일
#   1) 워크스페이스 디렉토리 생성
#   2) 보드(인스턴스 관리자) 인증 확보
#   3) 회사 패키지 임포트 (--dry-run 먼저 보여주고 확인받음)
#   4) 생성된 에이전트/프로젝트 ID를 .env.paperclip 으로 출력 (웹앱이 쓸 값)

set -euo pipefail

PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$PKG_DIR/../.." && pwd)"
WORKSPACE_DIR="/home/leehg/Documents/workspace/detail-page-workspace"
OUT_ENV="$PKG_DIR/.env.paperclip"

: "${PAPERCLIP_BASE_URL:?PAPERCLIP_BASE_URL 를 설정하세요}"

# 후행 슬래시 제거 — CLI 의 auth.json 키가 정규화된 형태로 저장된다
PAPERCLIP_BASE_URL="${PAPERCLIP_BASE_URL%/}"

# CLI 는 PAPERCLIP_BASE_URL 이 아니라 PAPERCLIP_API_URL 을 읽는다.
# 안 맞춰주면 CLI 가 http://localhost:3100 으로 기본값을 잡아 curl 과 다른 서버를 볼 수 있다.
export PAPERCLIP_API_URL="$PAPERCLIP_BASE_URL"

# PAPERCLIP_API_KEY 가 설정돼 있으면 CLI 가 저장된 보드 자격증명을 무시하고
# 대화형 보드 로그인 복구도 끈다 (cli/src/commands/client/common.ts). 에이전트 키는 여기서 쓸모없다.
if [ -n "${PAPERCLIP_API_KEY:-}" ]; then
  echo "!! PAPERCLIP_API_KEY 가 설정돼 있습니다. 회사 임포트에는 보드 인증이 필요하므로 무시합니다."
  unset PAPERCLIP_API_KEY
fi

AUTH_STORE="${PAPERCLIP_AUTH_STORE:-$HOME/.paperclip/auth.json}"

board_token() {
  [ -f "$AUTH_STORE" ] || return 0
  jq -r --arg base "$PAPERCLIP_BASE_URL" '.credentials[$base].token // empty' "$AUTH_STORE"
}

api() {
  local method="$1" path="$2"; shift 2
  curl -sS -X "$method" \
    -H "Authorization: Bearer $BOARD_TOKEN" \
    -H "Content-Type: application/json" \
    "$PAPERCLIP_BASE_URL$path" "$@"
}

echo "==> 1) 에이전트 워크스페이스 준비: $WORKSPACE_DIR"
mkdir -p "$WORKSPACE_DIR"
[ -f "$WORKSPACE_DIR/README.md" ] || cat > "$WORKSPACE_DIR/README.md" <<'MD'
# detail-page-workspace

상세페이지 스튜디오 에이전트들의 공용 작업 디렉토리.
산출물은 파일이 아니라 Paperclip 이슈 문서(issue documents)에 저장된다.
이 디렉토리는 에이전트 CLI가 실행될 cwd 역할만 한다.
MD

echo "==> 2) 헬스체크"
curl -sS "$PAPERCLIP_BASE_URL/api/health" | head -c 200; echo

echo
echo "==> 3) 보드(인스턴스 관리자) 인증 확인"
cd "$REPO_DIR"
BOARD_TOKEN="$(board_token)"
if [ -z "$BOARD_TOKEN" ]; then
  echo "저장된 보드 자격증명이 없습니다. 로그인을 시작합니다 (브라우저에서 승인하세요)."
  pnpm paperclipai auth login --instance-admin --api-base "$PAPERCLIP_BASE_URL"
  BOARD_TOKEN="$(board_token)"
fi
[ -n "$BOARD_TOKEN" ] || { echo "보드 로그인에 실패했습니다. 'pnpm paperclipai auth login --instance-admin' 를 직접 실행해 보세요."; exit 1; }

echo
echo "==> 4) 회사 패키지 임포트 (dry-run)"
pnpm paperclipai company import "$PKG_DIR" \
  --target new \
  --new-company-name "상세페이지 스튜디오" \
  --include company,agents,projects \
  --dry-run

echo
read -r -p "위 계획대로 실제 임포트할까요? [y/N] " ans
[ "$ans" = "y" ] || { echo "중단."; exit 0; }

pnpm paperclipai company import "$PKG_DIR" \
  --target new \
  --new-company-name "상세페이지 스튜디오" \
  --include company,agents,projects \
  --yes --json > /tmp/dp-import.json

COMPANY_ID="$(jq -r '.companyId // .company.id // empty' /tmp/dp-import.json)"
[ -n "$COMPANY_ID" ] || { echo "companyId를 못 찾았습니다. /tmp/dp-import.json 확인"; exit 1; }
echo "companyId = $COMPANY_ID"

echo
echo "==> 5) 에이전트/프로젝트 ID 조회"
AGENTS_JSON="$(api GET "/api/companies/$COMPANY_ID/agents")"
PROJECTS_JSON="$(api GET "/api/companies/$COMPANY_ID/projects")"

agent_id() { echo "$AGENTS_JSON" | jq -r --arg n "$1" '.[] | select(.name==$n) | .id' | head -1; }

ORCHESTRATOR_ID="$(agent_id Orchestrator)"
PROJECT_ID="$(echo "$PROJECTS_JSON" | jq -r '.[] | select(.name=="상세페이지 생산") | .id' | head -1)"

[ -n "$ORCHESTRATOR_ID" ] || { echo "Orchestrator 에이전트를 못 찾았습니다."; exit 1; }

cat > "$OUT_ENV" <<EOF
# setup.sh 가 생성함 — 웹앱 .env.local 로 옮겨 쓰세요
PAPERCLIP_BASE_URL=$PAPERCLIP_BASE_URL
PAPERCLIP_COMPANY_ID=$COMPANY_ID
PAPERCLIP_ORCHESTRATOR_AGENT_ID=$ORCHESTRATOR_ID
PAPERCLIP_PROJECT_ID=$PROJECT_ID
EOF

echo
echo "==> 완료. $OUT_ENV"
cat "$OUT_ENV"
echo
echo "다음 할 일:"
echo "  · 보드 UI에서 Orchestrator 의 하트비트 타이머를 켜세요 (임포트 시 항상 꺼진 채로 들어옵니다)"
echo "  · 각 에이전트의 'Test environment' 버튼으로 claude CLI 연결을 확인하세요"
echo "  · 웹앱이 쓸 PAPERCLIP_API_KEY 는 이 파일에 쓰지 않았습니다."
echo "    보드 UI에서 Orchestrator 의 에이전트 API 키를 발급해 웹앱 환경변수에 직접 넣으세요"
