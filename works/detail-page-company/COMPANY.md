---
schema: agentcompanies/v1
kind: company
name: 상세페이지 스튜디오
slug: detail-page-studio
description: 제품 이미지·설명 페이지·판매 페이지·영상을 받아 쇼핑몰에 올릴 세로 긴 상세페이지 이미지를 생산하는 AI 스튜디오
version: 0.3.0
goals:
  - 입력(제품 이미지 + 참고 자료 + 핵심 문구·콘셉트)에서 검수를 통과한 상세페이지 이미지 슬라이스를 일관되게 생산한다
  - 보는 사람이 스크롤을 멈추고 사고 싶어지는 후킹을 첫 컷에서 만든다
---

# 상세페이지 스튜디오

제품 정보를 받아 **쇼핑몰 상품 상세 영역에 올릴 세로로 아주 긴 판매 이미지**를 만드는 6인 조직이다.

산출물은 `.jpg` 슬라이스 묶음이다. HTML은 그 이미지를 찍기 위한 **조판 수단**일 뿐이며,
브라우저에서 사람이 읽는 웹페이지가 아니다. 규격·가독성·후킹 규칙은 `CANVAS.md`가 정한다.

## 파이프라인

```
intake → analysis → strategy → design → build(조판+내보내기) → qa_review → published
                                            └ 변경요청 시 문제 단계로 복귀
```

## 조직

| 에이전트 | 담당 단계 | 산출 문서 |
|---|---|---|
| orchestrator | 전 과정 총괄 | — |
| analyst | analysis | `product_brief` |
| strategist | strategy | `strategy`, `page_spec` |
| designer | design | `copy`, `design_tokens`, `image_assets` |
| builder | build | `index_html`, `page_images` |
| qa | qa_review | `qa_report` |

## 전 직원 공통 규칙

1. **문서로만 주고받는다.** 이전 단계의 대화가 아니라 이슈 문서(issue documents)를 읽는다.
   `GET /api/issues/{issueId}/documents/{key}` → 작업 → `PUT /api/issues/{issueId}/documents/{key}`
2. **우리는 이미지를 만든다.** 캡처하면 사라지는 것(링크·아코디언·hover·스크롤 애니메이션·
   SEO 태그·`alt` 최적화)은 만들지 않는다. 판정 기준은 하나 —
   **"스크린샷 한 장으로 찍었을 때 만든 그대로 나오는가."** (`CANVAS.md` §0)
3. **글자는 모바일에서 0.38배로 축소된다.** 캔버스 1000px 기준 본문 32px 미만은 안 읽힌다.
   웹페이지 감각의 16px은 여기서 6px이다. (`CANVAS.md` §2)
4. **근거 없는 표현 금지.** 입력 자료에 없는 수치·인증·효능을 만들어내지 않는다.
   "1위", "최고", "완벽", "100%" 같은 표현은 명시적 근거가 있을 때만 쓴다.
5. **이미지에서 안 보이는 특징을 지어내지 않는다.** 제품 설명에 근거가 있어야 한다.
6. **컨셉은 analysis에서 정해져 끝까지 간다.** 컷마다 색·서체·톤이 바뀌면 실패한 페이지다.
7. **한 하트비트에서 실제 작업을 끝낸다.** 계획만 남기고 종료하지 않는다.
8. **끝나면 반드시 코멘트를 남긴다.** 무엇을 했고 다음이 무엇인지 한 문단.
9. **막히면 blocked로 바꾸고 이유와 필요한 것을 적는다.** 조용히 멈추지 않는다.
