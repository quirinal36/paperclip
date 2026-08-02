---
kind: project
name: 필오프팩 상세페이지 1차 제작
slug: peeloff-detail-page
description: 프롬더스킨 글루타치온 콜라겐 필오프팩 50g 상세페이지를 설계서 v1.0의 24블록 규격으로 제작해 광고주 컨펌용 완성형으로 납품한다 (PILOT)
owner: director
---

# 필오프팩 상세페이지 1차 제작

설계 원본: `~/Documents/workspace/biomoa/상세페이지_설계서.md` v1.0
모드: **`PILOT`** — 게시본이 아니라 **광고주 납품 컨펌용 완성형**이다 (`pilot-mode` 스킬)

## 납품물

| 산출물 | 내용 |
|---|---|
| `page_markup` | 상품 상세 영역에 붙일 HTML (innerText 0) · `detail_pilot.html` · `publishable: false` |
| 이미지 슬라이스 | 폭 1020px JPEG/PNG, 총 ≤6MB — **24블록 중 이미지 18** |
| 영상 | H.264 MP4 6개, 폭 1020px 30fps 무음, 총 ≤8MB |
| **`placeholder_register`** | **빈칸으로 남긴 모든 자리의 대장 — 컨펌 미팅 자료로 그대로 쓴다** |
| `compliance_report` | 컨펌 발송 근거 — 전체 인상 판정 `pilot-pass` |
| `evidence_ledger` | 값이 들어간 수치의 실증자료 대응표 (15일 제출 대비) |

**채널 무관 공용 마스터**다. 오퍼·가격 블록을 편성하지 않으므로 공식몰·올리브영·무신사 어디에나 그대로 부착한다.

**대외 게시는 하지 않는다.** `LIVE` 전환 조건은 `placeholder_register` 0건 + 협회 자문 회신이며, 사람이 결정한다.

## 이슈 구조

- **부모 이슈** = 이 상세페이지 제작 건
- **자식 이슈** = 각 단계 작업 (gate / copy / plate / compose / publish)
- **산출물** = 부모 이슈에 붙는 issue documents

## 문서 키

| 키 | 작성자 | 내용 |
|---|---|---|
| `evidence_ledger` | evidence | D1~D6 상태 · 자료 경로 · 커버 문구 |
| `block_inventory` | director | 24블록 확정본 + 블록별 `pending` 목록 |
| `placeholder_register` | evidence | 빈칸으로 남긴 모든 자리의 대장 (**광고주 컨펌 자료**) |
| `copy_sheet` | copywriter | 블록별 카피 전문 |
| `compliance_report` | compliance | 심의 판정 · 지적 · 대체안 |
| `asset_manifest` | asset-producer | 판 목록 · 검수 결과 · P0 통과 여부 |
| `render_output` | compositor | PNG/MP4 경로 · `split_bands` |
| `page_markup` | publisher | 최종 HTML · 용량 · 검수 결과 |

## 착수 순서

**순서는 바꾸지 않되, 자료를 기다리느라 멈추지 않는다.**

```
1. 빈칸 대장 작성     → placeholder_register  ← 자료가 없어도 여기서 끝난다
2. Higgsfield 환경    ← 인증 · 크레딧 · Soul v2C 가용성 (여기만 사람이 필요할 수 있다)
3. 블록 인벤토리 확정  → block_inventory (24블록 전부 active)
4. 카피 → 심의        ← 심의 통과 전에는 조판 대상이 아니다
5. 판 생성 → P0       ← 전량 검수 통과 전 컴포지션 착수 금지 (품질 게이트, 유지)
6. 컴포지션 → 렌더     → PNG 18 · MP4 6
7. 슬라이싱 → 마크업
8. 전체 인상 판정 → 컨펌 발송 승인 (pilot-pass)
```

**병행 (파이프라인을 막지 않음)**: D1~D6 자료 확보 · 대한화장품협회 광고자문 접수(영상 콘티와 묶어서)
자료가 도착할 때마다 해당 블록에 **값만 주입해 재렌더**한다. 디자인 재작업은 없다.

**`blocked`가 정당한 경우는 셋뿐이다**: 제품 미특정 / Soul v2C 부재 / 크레딧 부족.
자료 미확보는 `blocked` 사유가 아니다 — 빈칸으로 등록하고 넘어간다.

## 완료 정의

아래를 **전부** 만족해야 완료다.

- [ ] **PNG 18 + MP4 6 = 24블록이 전부 파일로 존재한다** ← 파일럿의 핵심 완료 조건
- [ ] `page_markup`의 `innerText.length === 0`
- [ ] 총 용량 ≤14MB (이미지 ≤6MB / 영상 ≤8MB)
- [ ] **값이 들어간** 수치에 3종 세트 각주 (시험기관·시험기간·대상자수)
- [ ] **빈칸 자리에 `0`·`-`·`N/A`·예시 숫자가 없다.** 각주는 `※ 실증자료 확보 후 확정`
- [ ] `placeholder_register`가 실제 렌더의 빈칸과 개수·위치가 일치한다
- [ ] `compliance_report.overall_impression === "pilot-pass"` · `publishable: false`
- [ ] B23 AI 생성 고지 블록이 포함되어 있고 **B10 비포/애프터까지 커버한다** (**필수 블록**)
- [ ] B04·B13에 `※ 이해를 돕기 위해 도식화한 이미지` 고지가 붙어 있다
- [ ] `evidence_ledger`가 **값이 들어간** 모든 수치를 커버한다 — 15일 내 제출 가능
