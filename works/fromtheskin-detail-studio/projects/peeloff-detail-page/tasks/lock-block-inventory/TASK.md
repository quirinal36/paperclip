---
kind: task
name: 블록 인벤토리 확정
assignee: director
project: peeloff-detail-page
priority: high
---

# 블록 인벤토리 확정

`evidence_ledger`와 `placeholder_register`를 읽고 **24블록 각각에 무엇이 채워지고 무엇이 비는지** 확정한다.
이 문서가 나오기 전에는 카피도 판 생성도 시작하지 않는다.

## 절차

1. 실증 담당의 `evidence_ledger` · `placeholder_register`를 읽는다. 없으면 자식 이슈로 요청한다.
   **파일럿에서는 전 게이트 `미확보`를 기본값으로 놓고 바로 진행해도 된다** — 값이 비는 것뿐이고 블록은 살아 있다.
2. **24블록 전부를 `active`로 놓는다.** 파일럿에 `dropped`는 없다.
3. 값이 없는 자리를 블록별 `pending` 배열에 적는다. `placeholder_register`의 항목과 1:1로 맞춘다.
4. 블록마다 필요한 판(plate) ID를 `asset-gate` 스킬의 커버리지 표에서 가져와 적는다.
   **B10에는 M02·M03을 넣는다** — `[G8]`은 해제됐다.
5. 총높이(37,670px)와 영상 개수(6)를 계산해 기재한다.

## 판단 기준

**자료를 기다리지 않는다.** 파일럿의 목적은 광고주에게 완성형을 보여주는 것이다.

빈칸 몇 개가 있는 24블록 완성형이, 블록이 6개 빠진 "정확한" 페이지보다 컨펌 자료로 훨씬 낫다.
자료가 뒤늦게 확보되면 HyperFrames 변수만 교체하고 해당 블록만 재렌더하면 된다 — 디자인 재작업이 없다.

**B23(AI 생성 고지)은 필수 블록이다.** AI 인물을 비포/애프터에까지 쓰므로 더 중요해졌다.

## 완료 조건

`block_inventory`가 작성되고 **24블록 전부에 `status: active`와 `plates`가**, 값이 비는 블록에 `pending`이 채워진다.
그 뒤 카피(copywriter)와 판 생성(asset-producer) 자식 이슈를 만들어 배정한다.
