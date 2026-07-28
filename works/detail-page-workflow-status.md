# 상세페이지 스튜디오 — 워크플로우 현황

> 기준 2026-07-28 · 회사 `6db3478e-6fb3-4a18-9960-1cd0b0a53fe0` (상세페이지 스튜디오, slug `detail-page-studio`)
> 패키지 원본: [works/detail-page-company/](detail-page-company/) · 서버 `http://localhost:3100` (authenticated / private, health ok)

## 한 줄 요약

**지침은 전부 새 정의(세로 긴 판매 이미지)로 전환됐고 라이브에도 반영됐다.
파이프라인은 끝까지 완주해 12장의 슬라이스를 실제로 렌더했지만, 저장에 실패해 산출물이 유실됐다.**

지금 막고 있는 것은 품질이 아니라 **배관(Supabase 자격증명 주입)**이다.

---

## 1. 조직 — Orchestrator가 CEO

| 에이전트 | role | 담당 단계 | 상태 | timeout | maxTurns |
|---|---|---|---|---|---|
| **Orchestrator** | `ceo` | 전 과정 총괄 | idle | 900s | 120 |
| Analyst | `researcher` | analysis | idle | 1800s | 120 |
| Strategist | `product` | strategy | idle | 900s | 80 |
| Designer | `designer` | design | idle | 2400s | 160 |
| Builder | `engineer` | build(조판+내보내기) | idle | 2400s | 180 |
| QA | `qa` | qa_review | idle | 1200s | 100 |

- 어댑터는 6인 모두 `claude_local`, cwd `/home/leehg/Documents/workspace/detail-page-workspace`, `dangerouslySkipPermissions: true`
- 하트비트는 **Orchestrator만 300초 타이머**, 나머지 5인은 `wakeOnDemand`(배정될 때만 기상)
- 같은 회사에 `Page`(role ceo) · `Reflection Coach` · `Summarizer` · `Founding Engineer` 4인이 더 있으나 **전부 paused**. 상세페이지 파이프라인과 무관하며 `sync-agents.sh` 대상에서도 제외돼 있다

## 2. 파이프라인

```
intake → analysis → strategy → design → build(조판+내보내기) → qa_review → published
                                     └ 변경요청 시 문제 단계로만 복귀 (재실행 상한 3회)
```

부모 이슈 = 상세페이지 요청 1건, 자식 이슈 = 각 단계. 산출물은 부모 이슈의 issue documents에 붙는다.

### 단계 게이트

| 단계 | 완료 조건 | 담당 |
|---|---|---|
| analysis | `product_brief` — `concept.keywords` 3개 이상(각 `derived_from`) + `key_message` + `hook_candidates` 3개 이상 + 참고 링크 `fetch_status` 전부 기록 | Analyst |
| strategy | `strategy` + `page_spec` — 모든 컷에 `est_height`, `chosen_hook` | Strategist |
| design | `copy` + `design_tokens` + `image_assets` | Designer |
| build | `index_html` **+ `page_images`** — 슬라이스가 1장 이상 실제 존재 | Builder |
| qa_review | `qa_report.verdict == "pass"` | QA |

Orchestrator는 단계 전환마다 **컨셉 승계 검사**(analysis의 `concept.keywords`가 끝까지 동일한지)와
**참고 자료 오염 검사**(`unusable_expressions`가 `copy`에 새어들어갔는지)를 수행한다.

## 3. 규범 문서 4종 (전 직원 공통)

`sync-agents.sh`가 각 에이전트의 instructions 번들에 배포한다.

| 문서 | 줄 | 역할 |
|---|---|---|
| [PREAMBLE.md](detail-page-company/shared/PREAMBLE.md) | 43 | AGENTS.md 앞에 붙는 필수 선행 규칙. 나머지 3종을 먼저 읽게 만든다 |
| [CANVAS.md](detail-page-company/shared/CANVAS.md) | 190 | **무엇을 만드는가.** 캔버스 1000px, 모바일 0.38배 환산 가독성표, 금지 목록, 후킹 원칙, 그래픽 어휘 |
| [COMPLIANCE.md](detail-page-company/shared/COMPLIANCE.md) | 156 | **무엇을 말해도 되는가.** 허용/금지/금지조합 3단 + 단계별 책임 |
| [PRODUCT.md](detail-page-company/shared/PRODUCT.md) | 93 | 대상 제품(프롬더스킨 글루타치온 콜라겐 필오프팩)의 확인된 사실 |

### 포맷 계약 핵심 (CANVAS.md)

- 상세페이지 = 쇼핑몰에 올리는 **세로 긴 .jpg 슬라이스 묶음**. HTML은 조판 수단일 뿐
- 판정 기준 한 줄 — **"스크린샷 한 장으로 찍었을 때 만든 그대로 나오는가"**
- 캔버스 폭 1000px 고정 · 슬라이스 ≤2000px · 불투명 배경
- 모바일에서 0.38배 축소 → **본문 32px 미만은 안 읽힌다** (웹 감각의 16px은 여기서 6px)
- 금지: 링크 · 아코디언 · hover · 스크롤 애니메이션 · lazy · SEO/OG/구조화 데이터 · `alt` 최적화 · 외부 CDN

## 4. 배포 상태

패키지 ↔ 라이브 **6인 전원 동기화 완료** (`./sync-agents.sh` → 전부 `동일`).

| 파일 | 줄 |
|---|---|
| [orchestrator/AGENTS.md](detail-page-company/agents/orchestrator/AGENTS.md) | 100 |
| [analyst/AGENTS.md](detail-page-company/agents/analyst/AGENTS.md) | 279 |
| [strategist/AGENTS.md](detail-page-company/agents/strategist/AGENTS.md) | 130 |
| [designer/AGENTS.md](detail-page-company/agents/designer/AGENTS.md) | 423 |
| [builder/AGENTS.md](detail-page-company/agents/builder/AGENTS.md) | 286 |
| [qa/AGENTS.md](detail-page-company/agents/qa/AGENTS.md) | 156 |

배포 도구는 두 개다. 회사 임포트는 최초 1회뿐이라 이후 지침 변경은 반드시 아래를 거쳐야 반영된다.

- [`sync-agents.sh`](detail-page-company/sync-agents.sh) — 패키지 AGENTS.md + PREAMBLE을 라이브로 밀어넣고 공유 문서 3종 갱신. 기본 미리보기, `--apply`로 반영, `.bak-<타임스탬프>` 백업
- [`apply-compliance.sh`](detail-page-company/apply-compliance.sh) — 공유 문서만 배포(멱등). PREAMBLE 삽입은 최초 1회

---

## 5. 실행 이력 — 2회

### 런 1 · `상세페이지: 글루타치온 콜라겐 필오프팩` — `done`

구 지침(웹페이지 전제)으로 완주. 문서: `product_brief` `strategy` `page_spec` `copy` `design_tokens` `index_html` `qa_report` `completion_report` `orchestration_log`.
**`page_images`가 없다** — 이미지 산출 개념이 도입되기 전 런이다.

### 런 2 · `상세페이지: 글루타치온 콜라겐 필오프팩 50g` — 🔴 `blocked`

새 캔버스 지침으로 완주. 이슈 `fbec98f2-2a76-4383-8d6f-513b2a769cae`.
**파이프라인 자체는 새 정의대로 정확히 동작했다.**

| 항목 | 결과 |
|---|---|
| 슬라이스 | **12장**, 폭 1000px, 총 높이 **15,813px**, jpg q92 |
| 컷 구성 | hook / hero / empathy+turning_point / experience / ingredient / how_to_use / evidence / spec / lineup / faq / closing / notice |
| 강제 분할 | `forced: true` **0건** — 전부 컷 경계에서 깔끔히 잘림 |
| 렌더 엔진 | playwright/chromium headless-shell 151 |
| 폰트 | Pretendard base64 subset 임베드 (400/500/700/800), **`font_verified: true`**, CDN 미사용 |
| 깨진 이미지 | **0건** |
| 파일 크기 | 최대 162KB — 슬라이스당 2MB 제한 대비 여유 |

---

## 6. 🔴 지금 막고 있는 것

### (1) 산출물 유실 — 가장 시급

슬라이스 12장이 `/tmp/paperclip-run-bio-15-4403e73f-a0d-Og8Ma3/build/out/`에만 저장됐고
`persisted: false`였다. **해당 디렉터리는 이미 소멸했고 12장 전부 유실됐다.**

원인은 Supabase 자격증명이 **에이전트 런타임에 주입되지 않은 것**이다.
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`는 [detail-page-company/.env](detail-page-company/.env)에 존재하지만
`claude_local` 어댑터 프로세스가 그 값을 못 본다.

> **파이프라인이 완주해도 결과가 남지 않는 상태다.** 이것부터 고쳐야 나머지가 의미를 갖는다.
> 임시 조치로 렌더 출력 경로를 워크스페이스(`/home/leehg/Documents/workspace/detail-page-workspace/out/{issueId}/`)로
> 바꾸면 최소한 유실은 막을 수 있다.

### (2) Analyst 무응답 → 파이프라인 우회

자식 이슈 BIO-11이 `running`에서 24시간 이상 멈췄고, Orchestrator가 **직접 `product_brief`를 작성해** strategy로 넘겼다.
게이트는 통과했으나 analysis 단계가 실제로 수행되지 않았다.
지난 세션에서 Analyst timeout을 900s → 1800s로 올렸지만, 무응답 원인 자체는 미확인이다.

### (3) 품질 미달 3건 (런 2 기준)

| 항목 | 현황 | 기준 |
|---|---|---|
| 총 높이 | **15,813px** | 권장 6,000~12,000px. "15,000px 넘으면 끝까지 보는 사람 없다" 위반 |
| placeholder 컷 | `experience`(필오프 시퀀스) · `how_to_use` 2컷이 "촬영 예정" 프레임 | 실사진 필요 |
| 법정 표시사항 | notice 컷 7항목 + 실적 각주가 `[표기 필요]` 플레이스홀더 | 사람이 채워야 함 |

추가로 디자인 팔레트가 **웜 아이보리/브라운/골드**인데 제품 실제 색은 **민트-틸**이다.
Builder가 "쿨링 컬러 미채택"으로 의도했다고 기록했지만, 컨셉 승계 관점에서 재검토가 필요하다.

### (4) 문서 format 불일치

지침은 `format: json`을 지정하는데 실제 저장된 문서는 **전부 `format: markdown`**이고 body에 JSON 문자열이 들어 있다.
읽고 파싱하는 데는 문제가 없지만 규격과 어긋난다.

### (5) 웹앱 연동 미갱신

[detail-page-webapp-plan.md](detail-page-webapp-plan.md)는 `index_html` 다운로드를 전제로 작성돼 있다.
최종 납품물이 `page_images` 슬라이스로 바뀐 것이 반영되지 않았다. 결과 화면·다운로드 경로 수정이 필요하다.

---

## 7. 검증 결과

### ✅ 실측으로 확인된 것

**렌더 파이프라인** — Jetson(arm64)에서 Playwright/Chromium이 실제로 동작한다.
headless-shell 151로 15,813px 페이지를 12장으로 잘라냈고, 폰트 base64 임베드까지 성공했다.
이전에 "미검증"으로 남겨뒀던 항목이 런 2로 해소됐다.

**참고 자료 접근** (analyst 단계)

| 대상 | 결과 |
|---|---|
| 올리브영 | WebFetch 403 → `insane-search` engine이 **첫 시도에 200** (curl_cffi safari TLS + self-referer) |
| 자사몰 biomoashop.com | WebFetch 정상 |
| 쿠팡 | Akamai Bot Manager, 격자 51회 전부 challenge — **막힘** |
| YouTube | yt-dlp 경로 (미실행) |

**국내 상세페이지 본문은 텍스트가 아니라 이미지다.** 올리브영 페이지를 뚫어도 추출 텍스트는 516자 껍데기뿐이었다.
이미지 URL을 수집해 Read로 직접 보는 경로가 기본이며, 이게 우리 목적(조판 학습)에 오히려 정확하다.

**Higgsfield 이미지 생성** — 크레딧 실측(nano_banana_pro 4k=4 / 2k=2, seedream basic=1, soul_cinematic 2k=0.12)은 지침과 일치.
다만 세 가지 함정이 확인됐다:

| 현상 | 내용 |
|---|---|
| 조용한 자동 보정 | `aspect_ratio: 4:5` → `3:4`, `role: image` → `image_references`로 **거절 없이 변경**. `adjustments`에만 기록 |
| 모델 치환 | `nano_banana_pro` 요청 → **`nano_banana_2` 실행**. `adjustments`에 기록조차 없음 |
| 라벨 변조 | 원본 `50 g / 1.76 oz.` → seedream **`60 g / 1.7 oz`**, nano_banana_2 **`50 g / 1.78 oz.`** — **둘 다 폐기** |

라벨 변조는 프롬프트로 막을 수 없었다. 그래서 **패키지 표기가 읽히는 컷은 AI로 만들지 않고 원본을 쓰는 것**이 확정 규칙이다.

**의존성** — 시스템 python3에 pip가 없고 `ensurepip`도 비활성이라 `insane-search`의 자동 설치가 실패했다.
`curl_cffi 0.15.0` · `beautifulsoup4` · `pyyaml` · `pypdf`를 `~/.local/lib/python3.12/site-packages`에 수동 설치해 해소했다.

### ❓ 아직 검증되지 않은 것

- 슬라이스를 **실제 쇼핑몰에 업로드**했을 때의 표시 (스마트스토어·카페24 규격, 자동 축소 동작)
- QA의 이미지 육안 검수가 실제로 수행되는지 — 런 2의 `qa_report`는 산출물 유실 전에 작성됐다
- Analyst 무응답의 원인
- 참고 자료 분석 경로(`reference_sources`)가 실제 런에서 채워지는지 — 런 2는 Orchestrator가 우회했다

---

## 8. 다음 할 일 (우선순위)

1. **Supabase 자격증명을 에이전트 런타임에 주입한다.** 또는 렌더 출력 경로를 워크스페이스로 옮긴다.
   이게 되기 전까지 모든 런의 결과물은 사라진다
2. 런 2(`fbec98f2`)의 blocked를 해제하려면 — 산출물이 이미 없으므로 **build부터 재실행**해야 한다
3. Analyst 무응답 원인 조사. 재현되면 파이프라인의 첫 단계가 상시 우회된다
4. 총 높이를 12,000px 이하로 줄이도록 `page_spec` 컷 수·`est_height` 조정
5. placeholder 2컷의 실사진 확보, notice 법정 표시사항을 사람이 채움
6. 웹앱 결과 화면을 `page_images` 기준으로 수정
7. 문서 `format`을 json으로 맞춤 (선택 — 동작에는 지장 없음)
