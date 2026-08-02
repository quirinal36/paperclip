# 프롬더스킨 상세페이지 제작소

**프롬더스킨(from the skin) 글루타치온 콜라겐 필오프팩 50g** 상세페이지를 만드는 7인 에이전트 회사.
[Agent Companies](https://agentcompanies.io/specification) `agentcompanies/v1` 규격 패키지이며 [Paperclip](https://github.com/paperclipai/paperclip)에서 임포트해 실행한다.

설계 원본: `~/Documents/workspace/biomoa/상세페이지_설계서.md` v1.0 (2026-08-01)

---

## 이 회사가 푸는 문제

상세페이지 제작은 보통 "잘 팔리게 만들기" 하나가 목표다. 여기는 목표가 둘이고, 서로 당긴다.

1. **화장품법 광고 규제를 위반하지 않는다.** 위반 시 형사처벌 대상(제13조, 1년 이하 징역 또는 1천만 원 이하 벌금)이며 제조사가 행정처분을 받는다.
2. **그 제약 안에서 가능한 가장 센 페이지를 만든다.** 규제 준수 보고서가 아니라 판매 도구다.

특히 이 제품은 **글루타치온**을 쓴다. 소비자가 이미 '미백'으로 학습한 성분인데 식약처 미백 기능성 고시 성분이 **아니다.**
개별 문장이 전부 합법이어도 페이지 **전체 인상**이 "쓰면 하얘진다"로 읽히면 그 순간 위반이다.
그래서 이 회사에는 **거부권을 가진 심의 담당관**이 있다.

## 파이프라인

```
        ┌─ evidence : D1~D6 상태 + placeholder_register ─┐
intake ─┤                                                ├─→ director : 블록 인벤토리 확정
        └─ copywriter : 블록별 카피 ─────────────────────┘         │  (24블록 전부 active + pending)
                    ↑                                                ↓
                    └── compliance (거부권) ←──────────── 카피·연출 심의
                                                                     │
                                                                     ↓
                        asset-producer : Higgsfield 판 생성 ── P0 게이트 ──┐
                                                                            ↓
                                    compositor : HyperFrames 합성 → snapshot / render
                                                                            ↓
                                    publisher : 슬라이싱 · 인코딩 · 마크업 → detail_pilot.html
                                                                            ↓
                                            compliance : 전체 인상 판정 → pilot-pass
```

되돌림은 **원인 단계로만** 간다. 규제 위반이 **조합**에서 났으면 director까지 올라간다 — 블록 편성 자체를 바꿔야 하기 때문이다.

## 현재 모드: `PILOT` (광고주 컨펌용) ★

지금 이 회사가 만드는 것은 게시본이 아니라 **광고주 납품 컨펌을 받기 위한 완성형**이다.
최우선 목표는 **전 단계가 실제로 끝까지 도는 것**과 **24블록 완성형 품질**이다.

| | 처리 |
|---|---|
| **블록 수** | **항상 24블록 전부.** 파일럿에 `dropped`는 없다 |
| **D1~D6 미확보 수치** | 삭제하지 않고 **값만 빈칸(`pending`)으로 렌더** → `placeholder_register`에 등록 |
| **`[G8]` AI 인물 비포/애프터** | **사용한다.** 대신 `[S2]` 판정 기준을 올린다 (그레이스케일 대조) |
| **B04·B13 실사 물증** | Higgsfield 생성 + `※ 이해를 돕기 위해 도식화한 이미지` 병기 |
| **게시** | **대외 게시 금지.** 판정은 `pilot-pass`뿐 |

**심의 게이트는 하나도 안 풀렸다.** 값이 비어도 문장이 효능을 주장하면 여전히 위반이고,
광고주에게 위반 카피가 실린 페이지를 보여줄 이유가 없다. 해제된 것은 `[G8]` 하나뿐이다.

**숫자를 지어내지 않는다.** 빈칸은 진행 상태이고, 틀린 숫자는 허위광고다.
`0`·`-`·`N/A`·`준비중` 같은 값도 넣지 않는다 — 값처럼 읽힌다.

## 게이트

| 게이트 | 질문 | 관리자 | 파일럿 |
|---|---|---|---|
| **S1~S8** 심의 | 이 표현·연출을 써도 되는가 | `compliance` | **유지** |
| **D1~D6** 실증 | 이 숫자를 15일 내 제출 가능한 자료가 있는가 | `evidence` | 값만 빈칸 |
| **P0** 착수 | 전 에셋이 생성·다운로드·검수를 통과했는가 | `asset-producer` | **유지** (품질 게이트) |
| **전체 인상** | 페이지 전체가 미백 표방으로 읽히는가 | `compliance` | **유지** (품질 게이트) |

자료가 뒤늦게 오면 HyperFrames 변수만 교체하고 그 블록만 재렌더한다 — 디자인 재작업이 없다.
`LIVE` 전환 조건은 **`placeholder_register` 0건 + 협회 자문 회신**이며, 사람이 결정한다.

## 레이어 분리 — 제작 철칙

> **텍스트가 한 글자라도 들어가는 것은 Higgsfield 프롬프트에 넣지 않는다.**

| 레이어 | 담당 | 내용 |
|---|---|---|
| L1 · 판(plate) | **Higgsfield** | 인물 · 제품 · 배경 · VFX |
| L2 · 합성·타이포 | **HyperFrames** | 한글 카피 · 로고 · 수치 · 그래프 · 러너 UI · 각주 |
| L3 · 출력 | **HyperFrames** | `snapshot` → PNG 18 / `render` → MP4 6 |

생성형 AI는 한글·숫자·로고를 정확히 그리지 못한다. 그런데 이 페이지 정보량의 대부분이 타이포다.
그래서 만드는 주체를 레이어로 쪼갠다. 부수 효과로 톤앤매너가 CSS 토큰으로 구조적으로 보장되고,
카피 한 줄 고치는 비용이 이미지 재생성이 아니라 텍스트 수정 + 재렌더가 된다 — 광고자문 피드백 반영에 결정적이다.

## 조직

| 에이전트 | 직책 | 보고 대상 | 스킬 |
|---|---|---|---|
| **`director`** | 총괄 디렉터 | — | page-blueprint, ad-compliance, evidence-gate, product-facts, asset-gate |
| **`compliance`** | 심의 담당관 | director | ad-compliance, page-blueprint, product-facts, evidence-gate |
| **`evidence`** | 실증자료 담당 | compliance | evidence-gate, product-facts, ad-compliance, page-blueprint |
| **`copywriter`** | 카피라이터 | director | page-blueprint, ad-compliance, product-facts, evidence-gate |
| **`asset-producer`** | 에셋 프로듀서 | director | higgsfield-plates, asset-gate, page-blueprint, ad-compliance, product-facts |
| **`compositor`** | 컴포지션 엔지니어 | director | hyperframes-render, page-blueprint, asset-gate, ad-compliance |
| **`publisher`** | 퍼블리싱 엔지니어 | compositor | slice-and-markup, page-blueprint |

**팀** — `teams/`는 조직 문서다. Paperclip 임포터는 `agents/` · `skills/` · `projects/` · `tasks/`만 런타임 엔티티로 읽고 `teams/`는 넘긴다.
보고 라인은 각 AGENTS.md의 `reportsTo`가 만든다.

- `compliance-office` (심의실) — 매니저 `compliance`, 소속 `evidence`
- `production` (제작실) — 매니저 `compositor`, 소속 `publisher`

### 각 자리가 하는 일

- **총괄 디렉터** — 카피를 쓰지도 판을 만들지도 않는다. **파이프라인을 끝까지 굴려 완성형을 뽑는다.** 게이트 상태 → 블록 인벤토리 → 필요 에셋 순으로 확정하고, 단계마다 자식 이슈로 위임한다. 자료를 기다리느라 멈추지 않는다.
- **심의 담당관** — 이 회사에서 **거부권을 가진 유일한 자리.** 문장 심의 → 조합 심의 → 전체 인상 판정 3단으로 본다. `fail`을 낼 때는 반드시 대체안을 함께 낸다.
- **실증자료 담당** — 페이지에 실리는 모든 숫자의 출처를 책임진다. 판단 기준은 하나 — "지금 자료를 요청받으면 15일 안에 낼 수 있는가." 파일럿에서는 막지 않고 **빈칸으로 등록**하며, `placeholder_register`가 컨펌 미팅 자료가 된다.
- **카피라이터** — 24블록의 **모든 글자**를 쓴다. 판에는 글자가 없으므로 한 글자라도 빠지면 그 자리는 빈 공간이 된다.
- **에셋 프로듀서** — Higgsfield로 판을 만들고 **P0 게이트를 지킨다.** 톤앤매너 검수 7항목을 전 컷 나란히 놓고 판정한다.
- **컴포지션 엔지니어** — 판 위에 글자를 얹어 PNG 18 / MP4 6을 뽑는다. 분할 예정선에 여백 밴드를 미리 확보해 넘긴다.
- **퍼블리싱 엔지니어** — 슬라이싱·인코딩·마크업. **innerText 0**을 지키는 마지막 방어선.

## 스킬

패키지에 포함된 로컬 스킬 9종. `pilot-mode`를 제외한 8종은 설계서에서 파생됐다.

| 스킬 | 내용 |
|---|---|
| **`pilot-mode`** | **컨펌용 파일럿 규약 — 빈칸 렌더 규격 · 해제/유지 게이트 · `placeholder_register` · 게시 승인 조건** |
| `page-blueprint` | 24블록 인벤토리 · 구조 · 설계 원리 3가지 · 최소 게시 구성(`LIVE` 전용) |
| `ad-compliance` | S1~S8 · 금지 조합 · 허용 카피 사전 · 연출 심의 기준 |
| `evidence-gate` | D1~D6 · 다운그레이드 규칙 · 3종 세트 · 자료 대조법 |
| `product-facts` | 확인된 제품 사실 · 실사용 불만 · **미확인 항목(쓰면 안 되는 것)** |
| `higgsfield-plates` | 모델 스펙 시트 · 의상 고정 프롬프트 · M/P/F/R 매니페스트 · `[AI-1]` · `[G8]` 해제 시 생성 통제 |
| `asset-gate` | P0 게이트 · 검수 7항목 · 에셋↔블록 커버리지 |
| `hyperframes-render` | 레이어 분리 · 재사용 컴포넌트 7종 · 출력 규격 · 분할 여백 밴드 |
| `slice-and-markup` | 마크업 패턴 · 슬라이싱 · 용량 예산 14MB · 오디오 제거 · innerText 0 |

> **런타임 스킬은 `skills:` 목록에 넣지 않았다.** `higgsfield-soul-id` · `higgsfield-generate` ·
> `higgsfield-product-photoshoot` · `hyperframes` · `paperclip` 은 Claude Code 쪽 스킬이라
> 패키지에 없으면 임포트가 "not present in the package" 경고를 낸다.
> 어댑터가 `claude_local`이면 에이전트가 실행 중에 직접 로드하므로, AGENTS.md **본문**에
> "해당 스킬을 로드해 사용한다"고 적어 두는 편이 맞다.

## 프로젝트와 태스크

**`peeloff-detail-page`** — 필오프팩 상세페이지 1차 제작 (owner: `director`)

| 태스크 | 담당 | 우선순위 |
|---|---|---|
| 빈칸 대장 작성 + D4 확보 병행 | evidence | high |
| Higgsfield 환경 점검 | asset-producer | high |
| 블록 인벤토리 확정 | director | high |
| 24블록 카피 작성 | copywriter | high |
| 판 생성 및 P0 통과 | asset-producer | high |
| 재사용 컴포넌트 7종 제작 | compositor | medium |
| 24블록 컴포지션 및 렌더 | compositor | high |
| 슬라이싱 · 인코딩 · 마크업 | publisher | high |
| 전체 인상 판정 (컨펌 발송 최종 관문) | compliance | **urgent** |

> **`blocked`가 정당한 경우는 셋뿐이다**: 제품 미특정 / Soul v2C 부재 / 크레딧 부족.
> **자료 미확보는 `blocked` 사유가 아니다** — 빈칸으로 등록하고 넘어간다.

**회사 레벨 반복 태스크**
- `gate-status-review` — 주간 게이트 점검 (director, 매주 월 10:00 KST)

## 시작하기

Paperclip 서버가 떠 있어야 한다 (`curl -s localhost:3100/api/health`).

```bash
# paperclip 저장소 루트에서
pnpm paperclipai company import works/fromtheskin-detail-studio --dry-run   # 프리뷰
pnpm paperclipai company import works/fromtheskin-detail-studio             # 실제 임포트
```

저장소 밖에서 쓰려면 npm 배포본을 쓴다:

```bash
npx paperclipai company import <이 폴더 경로>
```

`--dry-run` 프리뷰 결과 (검증 완료): 에이전트 7 · 프로젝트 1 · 이슈 9 + 루틴 1 · 스킬 9 · errors 0 · warnings 0.

임포트 후 확인할 것:

1. **`.paperclip.yaml`의 `cwd`** — `/home/leehg/Documents/workspace/biomoa`로 잡혀 있다. 다른 머신이면 반드시 바꾼다.
2. **`HIGGSFIELD_API_KEY`** — `asset-producer`에만 필요하다. 보드 UI의 에이전트 설정에서 넣는다.
3. **Higgsfield / HyperFrames CLI** — `higgsfield auth login`으로 인증한다. `hf` 별칭은 PATH에 없으므로 항상 `higgsfield`로 호출한다.
4. **`gate-status-review` 루틴** — 임포트 시 타이머가 꺼진 채로 들어온다. 필요하면 켠다.

> **`.paperclip.yaml` 주석 주의**: Paperclip의 YAML 파서는 값 뒤 **인라인 주석을 걷어내지 않는다.**
> `brandColor: "#F2EFE9"   # 아이보리`라고 쓰면 주석까지 값에 들어간다. 주석은 항상 줄 단위로 쓴다.

패키지를 고친 뒤 이미 임포트된 회사에 반영하려면 에이전트 지침을 다시 밀어넣어야 한다.
회사 임포트는 처음 한 번뿐이라, 그 뒤 `agents/*/AGENTS.md`를 고쳐도 살아 있는 에이전트는 예전 지침을 계속 읽는다.
(같은 저장소의 `works/detail-page-company/sync-agents.sh`가 그 작업의 참고 구현이다.)

## 의도적으로 포기한 것

**innerText 0 · alt는 일련번호만.** 검색 유입 · 접근성 · AI 크롤러 대응 · Ctrl+F를 전부 포기한다.
**사용자가 지시한 트레이드오프**이지 버그가 아니다. 누구도 "SEO를 위해 텍스트를 넣자"고 되돌리지 않는다.

완화책은 페이지 **바깥**에 있다 — 채널 등록 시 상품명 · 요약설명 · 옵션명 · 고시정보 · 전성분 필드에 키워드를 넣는다.
벤치마크(메디힐)도 정확히 같은 구조이며 같은 비용을 치르고 있다.

## 참고

- 설계 원본: `~/Documents/workspace/biomoa/상세페이지_설계서.md` v1.0
- 선행 문서: `글루타치온팩_분석보고서.md` v1.3 · `foundation.md` · `콘티_트랙A_신뢰형_30초.md` v1.4
- 벤치마크: 올리브영 「메디힐 콜라겐 캡슐 패치 60+60매 더블 기획 2종」 (`goodsNo=A000000233470`) 27블록 전수 분석
- 스펙: [Agent Companies Specification](https://agentcompanies.io/specification)
- 런타임: [Paperclip](https://github.com/paperclipai/paperclip)

## 라이선스

MIT — [LICENSE](LICENSE) 참조.
