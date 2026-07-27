# 상세페이지 생성기 — 단일 기능 웹앱 구축 계획

> 원본 기획: [detail_page.md](detail_page.md)
> 작성일: 2026-07-27 · 대상: Paperclip fork (`custom/main`)

---

## 0. 한 줄 요약

제품 이미지 + 핵심 문구 + 콘셉트를 입력하면 판매용 상세페이지 HTML을 만들어 주는
**화면 하나짜리 웹앱**을 Vercel에 배포하고, 실제 생성 엔진은 이 리눅스 머신에서 돌고 있는
Paperclip 컨트롤 플레인이 담당한다.

---

## 1. 확정된 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 실행 엔진 | 이 Jetson 리눅스 머신의 Paperclip (이미 구동 중) | claude/codex CLI 구독 인증을 그대로 사용, 비용 0 |
| 외부 노출 | **Cloudflare Tunnel** | Vercel 함수는 Tailscale tailnet에 못 들어감. 터널은 아웃바운드 전용이라 공유기 포트 개방 불필요 |
| 프론트 | Vercel · Next.js (App Router) | 요구사항 |
| 데이터/파일 | Supabase Postgres + Storage | 요구사항 |
| Paperclip DB | **embedded-postgres 유지** (Supabase로 옮기지 않음) | 아래 §2.1 |
| 첫 스코프 | PoC 6 에이전트 + 단일 화면 | detail_page.md의 "현실적인 초기 버전" |
| 코드 위치 | `~/Documents/workspace/detail-page-web` (**별도 repo**) | FORK.md 원칙 — paperclip 코어/`ui/` 미수정 → upstream 충돌 0 |

---

## 2. 아키텍처

```
 [브라우저]
     │  ① 이미지 직접 업로드 (서명 URL)
     │─────────────────────────────────────► [Supabase Storage]
     │  ② 생성 요청
     ▼
 [Vercel · Next.js]  ── 화면 1개: 입력 → 진행 → 결과
     │   /api/* = BFF (PAPERCLIP_API_KEY는 서버에만 존재)
     │   · Supabase Postgres: job 레코드(사용자 소유·이력)
     │
     │  ③ HTTPS (Cloudflare Tunnel)
     ▼
 [Cloudflare Tunnel] ──► [Jetson · Paperclip :3100]
                              │  routine webhook → case 생성
                              ▼
                         6개 에이전트 파이프라인 (claude_local)
                              │
                              └─ 산출물 → issue documents (JSON/HTML)
```

### 2.1 왜 Paperclip DB를 Supabase로 안 옮기나

`docs/deploy/database.md`는 Supabase 호스팅을 정식 지원하지만, 이 구성에서는 **권장하지 않는다**:

1. **지연** — heartbeat의 모든 쿼리가 Jetson↔Supabase 인터넷 왕복이 된다. 에이전트 실행이 느려진다.
2. **결합도** — 웹앱이 Paperclip 내부 스키마를 직접 읽으면 upstream 마이그레이션마다 깨진다. FORK.md의 "코어 의존 최소화"에 반한다.
3. **불필요** — 웹앱이 필요한 건 "내 job 목록/상태/결과 링크"뿐이다. 그건 Supabase에 별도 테이블로 두면 된다.

→ **Supabase = 웹앱 전용 저장소**, **Paperclip = embedded PG 유지**, 둘 사이는 REST로만 통신.

### 2.2 CORS 주의

Paperclip 서버에 CORS 미들웨어가 없다(확인함). 브라우저에서 Paperclip API를 직접 부를 수 없으므로
**반드시 Next.js 서버 라우트(BFF)를 경유**한다. 부수효과로 API 키가 브라우저에 노출되지 않는다.

---

## 3. Paperclip 쪽 구성 (PoC 6 에이전트)

### 3.1 회사 / 에이전트

`agentcompanies/v1` 패키지로 만들어 `paperclipai company import`로 주입한다.
(`docs/companies/companies-spec.md`, `docs/guides/board-operator/importing-and-exporting.md`)

| # | slug | 역할 | detail_page.md 대응 |
|---|---|---|---|
| 1 | `orchestrator` | 총괄 (CEO) | 0. 오케스트레이터 |
| 2 | `analyst` | 제품·이미지 통합 분석 | 1-1 + 1-2 |
| 3 | `strategist` | 전략 + 페이지 구조 설계 | 2 + 3 |
| 4 | `designer` | 카피 + 아트 디렉션 | 4-1 + 4-2 |
| 5 | `builder` | 프론트엔드 빌더 | 6 |
| 6 | `qa` | 통합 QA (콘텐츠/디자인/기술) | 7-1~7-3 |

> 5단계(이미지 가공)는 PoC에서 제외 — detail_page.md도 "선택적 에이전트"로 분류.
> 안정화 후 1차~4차 분리 계획대로 12역할로 확장한다.

### 3.2 진행 모델 — 파이프라인 대신 이슈 계층 (v1 결정)

처음엔 pipelines/cases + routines + webhook 조합을 쓰려 했으나 **v1에서는 쓰지 않는다.**

이유: 같은 결과를 `issues` + `issue documents`만으로 얻을 수 있고, 그쪽이 검증된 API만 쓴다.
stage `automation`(routineId·assigneeAgentId 자동 배정)은 강력하지만 UUID 사전 주입이 필요해
셋업이 3단계 늘고, 실패 지점도 늘어난다.

**v1 모델:**

```
요청 이슈 (assignee: orchestrator, project: detail-page)
  ├─ [analysis]  → analyst    → product_brief
  ├─ [strategy]  → strategist → strategy, page_spec
  ├─ [design]    → designer   → copy, design_tokens
  ├─ [build]     → builder    → index_html
  └─ [qa]        → qa         → qa_report
```

- 웹앱은 **이슈를 하나 만들고 orchestrator에 배정**하기만 하면 된다.
  `wakeOnDemand: true`이므로 배정 즉시 하트비트가 뜬다 → **라우틴도 웹훅도 불필요**.
- 재실행은 orchestrator가 해당 단계 자식 이슈를 다시 만드는 것으로 처리.
- 재실행 상한 3회는 orchestrator가 자식 이슈 개수를 세어 판단한다.

> pipelines/cases는 v2에서 도입한다. 여러 요청을 한 보드에서 운영하게 될 때,
> 또는 사람 승인 게이트가 필요해질 때가 적기다.

### 3.2.1 진행률 계산

웹앱은 `GET /api/issues/{id}`의 `documentSummaries`에 어떤 키가 있는지로 단계를 판정한다.
별도 상태 필드가 필요 없다.

| 존재하는 문서 키 | 표시 단계 |
|---|---|
| (없음) | 분석 중 |
| `product_brief` | 전략 수립 중 |
| `strategy`, `page_spec` | 카피·디자인 중 |
| `copy`, `design_tokens` | HTML 구현 중 |
| `index_html` | 검수 중 |
| `qa_report` | 완료 |

### 3.3 단계 간 데이터 전달 = issue documents

detail_page.md의 JSON 핸드오프를 **issue documents**로 1:1 매핑한다.
(`docs/api/issues.md` — 키별 리비전 + `baseRevisionId` 낙관적 잠금, 충돌 시 409)

| 문서 key | format | 생산자 |
|---|---|---|
| `product_brief` | json | analyst |
| `strategy` | json | strategist |
| `page_spec` | json | strategist |
| `copy` | json | designer |
| `design_tokens` | json | designer |
| `index_html` | html | builder |
| `qa_report` | json | qa |

각 에이전트는 **이전 대화 전체가 아니라 필요한 문서만 읽는다** (detail_page.md §에이전트 간 전달 방식).

### 3.4 트리거

BFF가 이슈를 직접 만든다. 라우틴/웹훅 없음.

```
POST /api/companies/{companyId}/issues
{ "title": "상세페이지: {제품명}", "description": "...입력 블록...",
  "assigneeAgentId": "{orchestratorId}", "projectId": "{detailPageProjectId}",
  "status": "todo", "priority": "high" }
```

---

## 4. Supabase 스키마 (웹앱 전용)

```sql
create table jobs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users,
  status        text not null default 'queued',   -- queued|running|review|done|failed
  stage         text,                             -- analysis|strategy|design|build|qa_review
  input         jsonb not null,                   -- {productName, keyMessage, concept, imageUrls[]}
  paperclip_case_id  text,
  paperclip_issue_id text,
  result_html_path   text,                        -- Storage 경로
  error         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table jobs enable row level security;
create policy "own jobs" on jobs for all using (auth.uid() = user_id);
```

Storage 버킷:
- `product-images` (입력, 사용자별 폴더, 서명 URL 업로드)
- `generated-pages` (결과 HTML + 에셋)

---

## 5. Vercel 앱 (화면 1개)

```
detail-page-web/
├─ app/
│  ├─ page.tsx                 # 유일한 화면: 입력 → 진행 → 결과 (한 컴포넌트 3상태)
│  └─ api/
│     ├─ jobs/route.ts         # POST 생성 → Supabase insert + Paperclip webhook fire
│     ├─ jobs/[id]/route.ts    # GET 상태 폴링 (BFF가 Paperclip 조회 후 Supabase 갱신)
│     └─ upload-url/route.ts   # Supabase Storage 서명 업로드 URL 발급
├─ lib/{supabase,paperclip}.ts
└─ .env.local
```

**화면 상태 3개뿐:**
1. **입력** — 이미지 드롭존, 제품명, 핵심 문구, 콘셉트 선택
2. **진행** — 6단계 스텝바 + 현재 단계 로그 한 줄 (2~3초 폴링)
3. **결과** — iframe 미리보기 + HTML 다운로드 + "이 부분 다시" 버튼(단계 재실행)

환경변수(전부 서버 전용):
`PAPERCLIP_BASE_URL` · `PAPERCLIP_API_KEY` · `PAPERCLIP_COMPANY_ID` ·
`PAPERCLIP_ROUTINE_PUBLIC_ID` · `PAPERCLIP_WEBHOOK_SECRET` ·
`SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 6. 실행 계획 / 진행 상황

| Phase | 내용 | 상태 |
|---|---|---|
| **A** | 회사 패키지(6 에이전트 + 프로젝트 + `.paperclip.yaml`) 작성 | ✅ `works/detail-page-company/` |
| **B** | Supabase 스키마 SQL 작성 | ✅ `supabase-schema.sql` |
| **C** | Paperclip 셋업 스크립트 | ✅ `setup.sh` |
| **D** | Next.js 웹앱 (단일 화면 + BFF) | ✅ `~/Documents/workspace/detail-page-web` |
| **0** | Supabase 프로젝트 · Cloudflare 계정 · Paperclip API 키 · `vercel login` | ⏸ **이형구님 차례** |
| **E** | 스키마 적용 → `setup.sh` 실행 → 로컬 e2e | 대기 |
| **F** | Cloudflare Tunnel 연결 후 `vercel deploy --prod` | 대기 |

### 검증한 것

- `.paperclip.yaml` 이 importer 의 **자체 구현 YAML 파서**와 호환됨을 확인
  (전체 줄 주석은 필터로 제거됨 / 인라인 주석 없음 / `"#FF6B35"` 는 JSON.parse 경로)
- `AGENTS.md` 가 맞는 파일명 (가이드 문서의 `AGENT.md` 는 오기)
- stage `kind: "open"` 은 legacy, 신규는 `working` — 튜토리얼 문서가 구식
- `reviewerKind` 는 `human|any` 뿐 (`agent` 없음)
- 웹앱: `tsc --noEmit` 통과, `next build` 통과, 화면 렌더 확인, 입력 검증 400 응답 확인

---

## 7. 이형구님이 직접 해줘야 하는 것

1. **Paperclip API 키** — 브라우저에서 `http://192.168.0.84:3100` 로그인 후 발급.
   (현재 `authenticated/private` 모드라 CLI 도 인증 없이는 회사 목록조차 못 본다)
2. **Supabase 프로젝트** — [database.new](https://database.new) 생성 → `SUPABASE_URL`,
   `service_role` 키 확보 → `supabase-schema.sql` 을 SQL Editor 에서 실행
3. **Vercel 로그인** — `vercel login` (CLI 설치돼 있음)
4. **Cloudflare** — 배포 단계에서만 필요. 계정 없이 임시 터널로 먼저 시험해도 된다:
   `cloudflared tunnel --url http://localhost:3100` → `*.trycloudflare.com` URL
   (재시작마다 URL 이 바뀌므로 운영에는 named tunnel 필요)

> ⚠️ 터널을 여는 것은 이 머신의 Paperclip 을 인터넷에 노출시키는 일이다.
> Paperclip 은 `authenticated` 모드를 유지하고, 터널 URL 은 웹앱 서버 환경변수에만 둔다.
> 실제로 열기 전에 한 번 더 확인받는다.

---

## 8. 리스크

| 리스크 | 대응 |
|---|---|
| Jetson이 꺼지면 생성 중단 | 웹앱이 `queued` 상태로 유지 + 재시도. 상시성 필요해지면 VPS 이전 |
| 에이전트가 이미지에 없는 특징을 지어냄 | detail_page.md의 "이미지 근거 규칙"을 analyst 스킬에 명시 + qa가 검증 |
| 무한 재실행으로 품질 불안정 | `fields.retryCount` 상한 3, 초과 시 사람에게 에스컬레이션 |
| 터널 URL 노출 | Paperclip은 `authenticated` 모드 유지 + BFF만 키 보유. 터널에 Cloudflare Access 추가 가능 |
| upstream rebase 충돌 | 웹앱은 별도 repo, paperclip repo에는 이 문서와 회사 패키지만 추가 |
