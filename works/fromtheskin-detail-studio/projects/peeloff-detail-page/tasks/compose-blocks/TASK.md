---
kind: task
name: 24블록 컴포지션 및 렌더
assignee: compositor
project: peeloff-detail-page
priority: high
---

# 24블록 컴포지션 및 렌더

**착수 조건: 에셋 프로듀서의 P0 통과 선언.** 그 전에는 시작하지 않는다.

## 입력

- `block_inventory` — 무엇을 만들지
- `copy_sheet` (심의 통과본) — 모든 글자
- `evidence_ledger` — 수치와 각주
- `asset_manifest` — 판 파일 경로

## 절차

```
① hyperframes remove-background       제품 누끼 (P01·P02·P05·P08)
② 블록별 컴포지션 작성                판=배경, 타이포=레이어
③ hyperframes lint                    오류 사전 검출
④ hyperframes preview                 육안 검수
⑤ hyperframes snapshot → PNG          이미지 블록
   hyperframes render   → MP4          영상 블록
```

블록이 많으므로 **자식 이슈로 쪼개 병렬 진행한다.**

## 출력 규격

| 항목 | 값 |
|---|---|
| 캔버스 폭 | 2040px (@2x) |
| 이미지 | `snapshot` PNG, 블록 높이별 개별 컴포지션 |
| 영상 | `render` MP4 (H.264), 폭 1020px, 30fps, **오디오 없음** |

## 분할 여백 밴드 — 잊지 않는다

분할 예정선(1,000~1,500px 간격) 자리에 **여백 밴드를 미리 확보**하고
좌표를 `render_output.split_bands`에 적는다. 이게 없으면 퍼블리싱 엔지니어가 자를 수 없다.

## 조판 심의 자기 검열

- 비포/애프터에 **색보정·노출 보정 없음** (`[S2]`)
- 도해에 **흡수 경로 화살표 없음**, 표피·각질층 스케일 유지 (`[S3]`)
- **B06과 B10을 시각적으로 연결하지 않음** (조합 위반)
- 각주가 읽히는 크기

애매하면 `preview`를 심의 담당관에게 보낸다.

## 완료 조건

`render_output`에 PNG(활성 이미지 블록 수)와 MP4(영상 블록 수) **파일 경로**가 적히고,
**그 파일들이 실제로 존재한다.** `lint` 통과와 파일 생성은 다른 사건이다.
`copy_sheet`의 모든 문구가 실제로 렌더됐는지 1:1로 대조한다.
