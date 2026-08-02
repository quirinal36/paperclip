---
name: higgsfield-plates
description: Higgsfield로 판(plate)을 생성하는 규약 — 모델 스펙 시트, 의상 고정 프롬프트, M/P/F/R 에셋 매니페스트, [AI-1]·[G8] 주의사항, 네거티브 고정 문자열. 인물·제품·VFX 컷을 생성할 때 사용한다.
metadata:
  paperclip:
    tags:
      - higgsfield
      - asset
  sources:
    - kind: local-file
      path: ~/Documents/workspace/biomoa/상세페이지_설계서.md
      attribution: bio-moa-medical
      usage: referenced
---

# 판(plate) 생성 규약

**Higgsfield는 판만 만든다.** 인물·제품·배경·VFX — 픽셀로만 존재하는 것.

## 철칙 — 글자를 만들지 않는다

**텍스트가 한 글자라도 들어가는 것은 Higgsfield 프롬프트에 넣지 않는다.**

전 프롬프트에 네거티브를 고정 삽입한다:

```
no text, no letters, no logo, no watermark
```

한글 카피·로고·수치·그래프·러너 UI·각주는 전부 HyperFrames가 HTML로 얹는다.

> 단, HyperFrames는 **제품 위에 얹는 글자**를 해결하지 **제품에 인쇄된 글자**를 해결하지 않는다.
> 곡면 튜브에 감긴 라벨(M04·M05·P01)은 여전히 Higgsfield 문제다.

## 도구 환경

| 항목 | 상태 |
|---|---|
| Higgsfield CLI | `higgsfield` v1.1.20 (`/home/leehg/.hermes/node/bin/higgsfield`) — **`hf` 별칭은 PATH에 없다. 항상 `higgsfield`로 호출한다** |
| 인증 | 생성 전 `higgsfield auth login` → `higgsfield workspace set <workspace_id>` |
| 커맨드 | `soul-id` · `generate create/wait/get` · `product-photoshoot` · `upload` · `account status` |
| 참고 스킬 | `higgsfield-soul-id` · `higgsfield-generate` · `higgsfield-product-photoshoot` |

착수 전 매번:

```bash
higgsfield auth login
higgsfield workspace set <id>
higgsfield account status    # 크레딧 확인 — 건너뛰면 중간에 잡이 죽는다
higgsfield soul-id list      # Soul v2C 가용성 — 없으면 재학습 필요
```

**직전 캠페인에서 확인된 실무 주의:**
- Seedance **동시 실행 ~6개 제한** (초과 시 429). 배치를 쪼갠다.
- 프리셋 추천 노티스가 뜨면 `declined_preset_id`로 **리터럴 재제출**.
- 일체형 구조물은 `PERMANENTLY ATTACHED` 강제 — **스파출라 일체형(P03)에 그대로 적용.** 안 하면 분리형으로 그려진다.

## 모델 스펙 시트

| 항목 | 사양 |
|---|---|
| **Soul Character** | **v2C 재사용** (`soul_2` 잡 `3004505b…`) — 트랙A 프리비즈와 동일 인물 |
| 외모 | 20대 한국인 여성, 모델·연예인급 비주얼. **실존 인물 아님** |
| **의상 (고정)** | **새하얀 끈나시** — 얇은 스트랩의 화이트 슬리브리스 캐미솔 |
| 헤어 | 다크 브라운 롱헤어, 자연스럽게 정돈 (얼굴 라인을 가리지 않게) |
| 메이크업 | 니어 누드 — 베이스 최소, 립은 누드~MLBB. **하이라이터 금지** |
| 표정 | 무표정~은은한 미소. 과장된 리액션 금지 (「조용한 확신」 무드) |
| 배경 | 화이트·아이보리 그라데이션 또는 소프트 뉴트럴. **컬러 배경 금지** |
| 조명 | 소프트 디퓨즈, 정면~45도. **하드 스펙큘러 금지** |

### 의상 프롬프트 고정 문자열

모든 인물 컷 프롬프트에 **동일 문자열 그대로** 삽입한다. 한 글자도 바꾸지 않는다.

```
wearing a pure white sleeveless camisole top with thin spaghetti straps,
clean minimal styling, bare shoulders, soft ivory-white background,
diffused soft lighting, natural dewy skin with subtle sheen (no glitter, no highlighter),
calm confident expression, editorial beauty photography
```

> **왜 새하얀 끈나시인가**: 톤앤매너가 「화이트·아이보리 베이스 + 진주빛 하이라이트」다.
> 화이트 의상은 배경과 하나로 이어져 **시선이 피부와 제품에만 머물게** 한다.
> 어깨·목선이 드러나므로 「윤기」 소구의 판정 면적도 넓어진다.

## M — 모델 컷 (Soul v2C)

| ID | 컷 | 용도 | 비고 |
|---|---|---|---|
| M01 | 얼굴 클로즈업 · 정면 | B09 | CP01 헤더 |
| M02 | 얼굴 클로즈업 · 45도 · **윤기 높음** | B10 애프터 | **M03과 페어** — 동일 조명·각도 |
| M03 | 얼굴 클로즈업 · 45도 · **윤기 낮음** | B10 비포 | **`[G8]`** |
| M04 | 제품을 손에 들고 있는 상반신 | B01 · B21 | **`[AI-1]`** |
| M05 | 제품을 얼굴 옆에 들고 있는 컷 | B02 | **`[AI-1]`** |
| M06 | 팩 도포 중 (얼굴에 흰 제형) | B18 STEP2 | |
| M07 | 팩 건조 상태 (투명 필름) | B18 STEP3 | |
| M08 | 필름 떼어내는 중 (가장자리) | B18 STEP4 | |
| M09 | 30분 대기 인서트 (독서·홈트) | B18 | |
| M10 | 푸석함 표현 표정 (볼에 손) | B02 | **`[S2]`** 명도 아닌 **질감**으로 |
| M11 | 목·어깨 라인 윤기 클로즈업 | B15 | 끈나시 착장의 이점 활용 |

## P — 제품 컷 (product-photoshoot)

| ID | 컷 | 용도 | 모드 |
|---|---|---|---|
| P01 | 제품 히어로 (튜브+스파출라, 화이트) | B01 | `product_shot` |
| P02 | 45도 각도 무드컷 | B05 | `product_shot` |
| P03 | 스파출라 트위스트 구조 디테일 | B16 | `product_shot` (매크로) |
| P04 | 제형 매크로 (흰 크림 질감) | B06 · B08 | `conceptual_product` |
| P05 | 튜브 용기 구조 컷 | B19 | `product_shot` |
| P06 | 성분 합성 베이스 | B08 | `conceptual_product` |
| P07 | 패키지 정면 (전성분 표기면) | B08 | **실사 스캔 권장** — 텍스트 정확도 |
| P08 | 아이보리 소품과 함께 (홈에스테틱 무드) | B21 | `lifestyle_scene` |

> **P03·P07은 글자·구조 정확도가 생명이다.** 스파출라 「트위스트 온/오프 일체형」 구조가 분리형으로 그려지거나
> 전성분 텍스트가 깨지면 그대로 오정보가 된다. **생성 후 실물 대조 검수 필수.**

## F — VFX · CGI (generate)

| ID | 컷 | 용도 | 유형 |
|---|---|---|---|
| F01 | 글루타치온 성분 CGI (투명 구체·입자) | B06 | 이미지 — **피부 침투 연출 금지**, 성분 물성만 |
| F02 | 300Da 저분자 콜라겐 CGI | B07 | **영상 5초** |
| F03 | 각질층 표면 확대 CGI | B03 | 이미지 · **`[S3]` 표피까지만** |
| F04 | 광채 파티클 오버레이 | B09 · B10 | 이미지(알파) |
| F05 | 필름 형성 프로세스 도해 | B04 보조 | 이미지 |
| F06 | 피부결 정돈 시각화 | B12 | 이미지 · **`[S3]`** |

## R — 실사 물증 컷 (권고)

| ID | 컷 | 용도 | 사유 |
|---|---|---|---|
| R01 | **필오프 4단 변신 타임랩스** | B04 ★ | 제형의 물리적 거동 |
| R02 | **필름 뒷면 매크로 (부착된 노폐물)** | B13 ★ | 제품 고유 물증 |
| R03 | 스파출라 도포 데모 (손등) | B17 | 사용 실증 |
| R04 | 적정 사용량 · 얇게/두껍게 대조 | B18 | 교육 정확도 |

> **B04와 B13은 실사 촬영을 권고한다.** 이 둘은 "제품이 실제로 이렇게 작동한다"는 **물증**이다.
> AI로 생성하면 ①실증 없는 효과 연출이 되어 심의에서 가장 취약한 지점이 되고
> ②소비자가 CG로 인지하는 순간 페이지 전체의 신뢰가 무너진다.
>
> Higgsfield 경로를 선택할 경우 F05(필름 형성 도해)를 확장해 대체하고
> 「이해를 돕기 위해 도식화한 이미지」 고지를 병기한다. **최종 판단은 사람 몫이지만 권고는 기록에 남긴다.**

## `[AI-1]` — 제품이 등장하는 인물 컷

생성형 AI는 제품 패키지의 텍스트·로고를 **거의 반드시 왜곡시킨다.**

M04·M05는 둘 중 하나를 전제로 한다:
1. **제품 실사 컷을 레퍼런스로 업로드**해 생성
2. AI 컷 위에 **실사 제품을 합성**하는 후처리

**왜곡된 라벨이 그대로 나가면 제품 신뢰가 즉시 무너진다.** 검수 6항목에서 반드시 잡는다.

## `[G8]` — AI 인물 비포/애프터 페어 (해제됨 · 사용한다)

사용자 결정으로 **M02/M03을 B10에 투입한다.** 협회 자문을 기다리지 않는다.

자문 없이 쓰는 만큼 **생성 단계에서 통제**해야 한다. `[S2]` 위반은 여기서 만들어진다.

- **동일 프롬프트 + 동일 시드 계열**에서 윤기 파라미터만 다르게 간다. 표정·각도·조명 문구를 바꾸지 않는다
- **밝기·톤 형용사를 프롬프트에 넣지 않는다**

| ❌ 금지 | ✅ 사용 |
|---|---|
| `brighter`, `radiant skin tone`, `luminous`, `glowing complexion`, `even tone` | `dewy sheen`, `smooth texture`, `soft reflection` |
| (비포) `dull tone`, `darker` | (비포) `matte surface`, `dry texture`, `rough texture` |

- 생성 후 **두 컷을 그레이스케일로 변환해 나란히 놓는다.** 밝기 차이가 보이면 `_rejected/`
- 검수 5항목(`[S2]`)은 이 페어에서 가장 엄격하게 적용한다

> AI는 "애프터를 예쁘게" 만들려는 편향이 있다. 가만두면 애프터가 저절로 밝아지고,
> 그 순간 페이지 전체가 명도 서사로 읽힌다.

## B04 · B13 — 파일럿에서는 Higgsfield로 간다

실사(R01·R02) 권고 자리지만 **촬영 대기로 파이프라인을 멈추지 않는다.**
F05(필름 형성 도해)를 확장해 생성하고 `※ 이해를 돕기 위해 도식화한 이미지` 고지를 병기한다.

- `placeholder_register`에 `asset_substitutions`로 등록한다
- **실사 권고는 살아 있다.** `LIVE` 전환 시 실사 교체를 전제로 광고주에게 설명한다
- **도식화 고지 없이 사실적 실사처럼 렌더하지 않는다** — 그건 실증 없는 효과 연출이다

## 저장 규약

```
biomoa/assets/
  model/      M01_face-closeup-front_<jobid>.png
  product/    P01_hero-tube-spatula_<jobid>.png
  vfx/        F02_collagen-300da_<jobid>.mp4
  live/       R01_peeloff-timelapse.mp4
  _manifest.json      # ID · 잡ID · 프롬프트 · 생성일시 · 검수결과
  _rejected/          # 검수 탈락본 (재생성 이력 추적용)
```

- 명명: `{ID}_{영문-슬러그}_{jobid}.{ext}`
- 해상도: 이미지 **폭 2040px 이상**(@2x) · 영상 **폭 1020px 이상**
- 원본(생성 그대로)과 후처리본을 **분리 보관**. 상세페이지에는 후처리본만 투입
