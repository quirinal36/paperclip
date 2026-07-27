---
kind: project
name: 상세페이지 생산
slug: detail-page
description: 웹앱에서 들어온 상세페이지 생성 요청을 처리하는 프로젝트
owner: orchestrator
---

# 상세페이지 생산

Vercel 웹앱에서 들어온 요청 하나가 이 프로젝트의 이슈 하나가 된다.

- 부모 이슈 = 하나의 상세페이지 요청 (`intake`)
- 자식 이슈 = 각 단계 작업 (analysis / strategy / design / build / qa_review)
- 산출물 = 부모 이슈에 붙는 issue documents

**최종 납품물은 `page_images`의 jpg 슬라이스 묶음**이다 (`CANVAS.md`).
`index_html`은 그 이미지를 찍기 위한 조판 소스이며, 그 자체로는 납품물이 아니다.
웹앱은 결과 화면에서 슬라이스를 순서대로 미리보기하고 zip으로 내려받게 한다.

## 요청 이슈 설명 포맷

웹앱 BFF가 아래 형태로 이슈를 만든다.

```markdown
## 입력

- 제품명: {productName}
- 핵심 문구: {keyMessage}          ← 비어 있으면 analyst 가 참고 자료에서 도출한다
- 콘셉트: {concept}                ← 비어 있으면 analyst 가 참고 자료에서 도출한다
- 이미지:
  - https://{supabase}/storage/v1/object/public/product-images/...
  - ...
- 참고 자료:
  - {url}  (kind: official_product | selling_page | brand_site | video | review_hub | competitor)
  - ...

## 요청 출처

webapp job: {jobId}
```

### 참고 자료

제품 설명 웹페이지 / 실제 판매 중인 페이지 / 제품 영상 링크를 받는다.
**컨셉·톤앤매너·핵심 문구를 여기서 읽어낸다.**

- `kind`를 웹앱이 알면 붙여 주고, 모르면 생략한다 (analyst 가 열어보고 판정한다)
- 자사 판매 페이지가 하나라도 있으면 톤 추출 정확도가 크게 올라간다
- 경쟁사 링크도 받을 수 있다. 단 **구조를 배우는 용도**이며 문구·이미지는 가져오지 않는다
- 이미지 없이 자사 판매 페이지만 들어와도 진행할 수 있다 (analyst 가 그 페이지에서 제품 이미지를 수집)
