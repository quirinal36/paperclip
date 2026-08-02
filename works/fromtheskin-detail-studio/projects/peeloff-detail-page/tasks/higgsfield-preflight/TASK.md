---
kind: task
name: Higgsfield 환경 점검
assignee: asset-producer
project: peeloff-detail-page
priority: high
---

# Higgsfield 환경 점검

판 생성을 시작하기 전에 환경이 실제로 준비됐는지 확인한다.
이걸 건너뛰면 배치 중간에 잡이 죽고 크레딧만 소모된다.

## 체크리스트

```bash
higgsfield auth login                # 인증 (현재 미인증 상태로 기록되어 있음)
higgsfield workspace set <id>        # 워크스페이스 지정
higgsfield account status            # 크레딧 잔여 확인
higgsfield soul-id list              # Soul v2C 가용성 확인
```

- [ ] 인증 완료
- [ ] 워크스페이스 지정 완료
- [ ] **크레딧 잔여 확인** — 직전 캠페인 기준 누적 358.96 사용 / 잔여 174.49. 현재 값을 다시 확인한다
- [ ] **Soul v2C 가용성** (`soul_2` 잡 `3004505b…`) — 없으면 **재학습이 필요하다.** 즉시 보고
- [ ] `hyperframes` CLI 동작 확인 (v0.6.115, `/home/leehg/.bun/bin/hyperframes`)

## 사전 결정 사항 — 파일럿에서는 **이미 결정됐다**

사람의 결정을 기다리지 않는다. 아래대로 진행하고 `placeholder_register`에 등록만 한다.

| 항목 | 결정 |
|---|---|
| **`[G8]` AI 인물 비포/애프터** | **사용한다.** M02·M03을 B10에 투입. 협회 자문 회신을 기다리지 않음 |
| **B04·B13** | **Higgsfield 생성으로 진행.** F05 확장 + `※ 이해를 돕기 위해 도식화한 이미지` 병기 |
| 브랜드 로고 원본 | 없으면 **타이포 로고로 대체**하고 등록 |
| 제품 패키지 원본 (P07) | 없으면 **Higgsfield 생성본으로 대체**하고 등록 |

`[G8]`을 쓰는 대가로 **M02/M03 생성 통제가 빡빡해진다** (`higgsfield-plates` 스킬 §`[G8]`):

- 동일 프롬프트 + 동일 시드 계열, 윤기 파라미터만 변경
- 밝기·톤 형용사 금지 (`brighter`·`radiant`·`luminous`·`dull tone`)
- 생성 후 **그레이스케일 대조** — 밝기 차이가 보이면 `_rejected/`

## 완료 조건

`asset_manifest`에 환경 점검 결과와 위 결정 사항을 기록하고 총괄 디렉터에게 보고한다.

**Soul v2C가 없거나 크레딧이 부족할 때만 `blocked`로 둔다.** 그 둘은 사람이 풀어야 하는 문제다.
나머지는 전부 위 기본값대로 진행한다.
