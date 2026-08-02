---
name: slice-and-markup
description: 상세페이지 슬라이싱·인코딩·마크업 규격 — lazy-load 패턴, innerText 0, alt 일련번호, 용량 예산 14MB, 오디오 스트림 제거. 렌더 출력물을 쇼핑몰 게시본으로 만들 때 사용한다.
metadata:
  paperclip:
    tags:
      - markup
      - publishing
  sources:
    - kind: local-file
      path: ~/Documents/workspace/biomoa/상세페이지_설계서.md
      attribution: bio-moa-medical
      usage: referenced
---

# 슬라이싱 · 인코딩 · 마크업

## 마크업 패턴 (벤치마크 동일)

```html
<div class="contEditor" id="tempHtml2" style="display: block;">

  <!-- 이미지 블록: 첫 슬라이스만 즉시 로드(LCP), 나머지는 lazy -->
  <div class="speedycat-container">
    <img src="https://cdn.example.com/.../b01_0.jpg"
         alt="프롬더스킨 글루타치온 콜라겐 필오프팩 1"
         style="width:100%;object-fit:cover;background:#eee;line-height:0;display:block">
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
         data-src="https://cdn.example.com/.../b01_1.jpg"
         alt="프롬더스킨 글루타치온 콜라겐 필오프팩 1"
         style="width:100%;object-fit:cover;background:#eee;line-height:0;display:block">
  </div>

  <!-- 영상 블록 -->
  <div style="line-height:0;font-size:0px;">
    <video class="s-lazy" muted playsinline loop preload="none"
           style="width:100%;display:block;height:auto;">
      <source data-src="https://cdn.example.com/.../v02.mp4" type="video/mp4">
    </video>
  </div>

</div>
```

| 항목 | 값 |
|---|---|
| placeholder | 1×1 투명 GIF (`R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==`) |
| 실제 URL | `data-src` 속성 |
| CLS 방지 | `background:#eee` 자리표시 |
| 여백 제거 | `line-height:0; font-size:0px` (영상 래퍼) |
| **텍스트 노드** | **전면 금지** — innerText가 0이어야 함 |
| **alt** | `프롬더스킨 글루타치온 콜라겐 필오프팩 {일련번호}` **고정 형식** |

영상 래퍼의 `line-height:0; font-size:0px`를 빠뜨리면 영상 아래에 정체불명의 여백이 생긴다.

## 슬라이싱

- 소스는 HyperFrames `snapshot` 출력 PNG (캔버스 폭 2040px @2x → **1020px 다운샘플**)
- 논리 블록 1장을 **1,000~1,500px 단위로 세로 분할** → `b{블록}_{슬라이스}` 명명
- 분할 목적: 뷰포트 단위 lazy-load + 단일 파일 용량 억제
- **분할 지점은 텍스트·얼굴을 가로지르지 않는다.** 여백 라인에서 자른다
- 컴포지션 엔지니어가 넘긴 `render_output.split_bands` 좌표를 쓴다
- **좌표가 없거나 그 자리에 여백이 없으면 자르지 말고 되돌린다** — 임의로 자르면 렌더 사고가 된다

## 용량 예산

| 유형 | 규격 | 블록당 상한 | 총 예산 |
|---|---|---|---|
| 이미지 | 폭 1020px 고정 · 사진 비중 高 → **JPEG q82** / 타이포·단색 高 → **PNG** | 500KB | **≤ 6MB** |
| 영상 | H.264 MP4 · 폭 1020px · 30fps · **오디오 스트림 제거** · 4~8초 | 2.0MB | **≤ 8MB** |
| **합계** | | | **≤ 14MB** |

벤치마크 실측: 이미지 5.45MB + 영상 6.67MB = 12.1MB. 우리 예산은 여기에 여유분을 더한 값이다.

**예산을 넘으면 임의로 화질을 떨어뜨리지 않는다.** 어느 블록이 얼마나 넘었는지 적어 컴포지션 엔지니어에게 되돌린다.

## 오디오 스트림 제거

영상은 전부 무음이므로 **오디오 스트림을 아예 제거한다.**
`muted` 속성만으로는 부족하다 — 트랙이 남아 있으면 들리지도 않으면서 용량만 차지한다.
벤치마크는 7개 중 3개에 무의미한 AAC 트랙이 남아 있었다.

```bash
ffmpeg -i in.mp4 -an -c:v libx264 -crf 23 -vf scale=1020:-2 -r 30 -pix_fmt yuv420p out.mp4
ffprobe -v error -show_entries stream=codec_type -of csv=p=0 out.mp4   # video 만 나와야 한다
```

## 게시 전 최종 검수

**전부 실제로 실행해서 확인한다.** 마크업을 읽고 추정하지 않는다.

- [ ] `innerText.length === 0` — 텍스트 노드가 하나도 없다
- [ ] 모든 `alt`가 `프롬더스킨 글루타치온 콜라겐 필오프팩 {일련번호}` 형식이다
- [ ] 첫 이미지만 `src` 즉시 로드, 나머지 전부 `data-src` lazy다
- [ ] 모든 영상에 오디오 스트림이 없다 (`ffprobe`로 확인)
- [ ] 이미지 ≤6MB / 영상 ≤8MB / 총 ≤14MB
- [ ] **24블록이 전부 들어갔고** 순서가 `block_inventory`와 일치한다 (파일럿에 `dropped`는 없다)
- [ ] 파일럿이면 `publishable: false` 명시 · 파일명 `detail_pilot.html` · 출력 `out/pilot/`
- [ ] 빈칸(`pending`) 자리가 슬라이스 경계에 걸려 잘리지 않았다
- [ ] 슬라이스 경계가 텍스트·얼굴을 가로지르지 않는다 — **이미지를 열어 눈으로 확인**
- [ ] 영상 래퍼에 `line-height:0; font-size:0px`이 있다

## innerText 0은 결정이지 버그가 아니다

검색 유입 · 접근성 · AI 크롤러 대응 · Ctrl+F를 전부 포기하는 방침이다. **사용자가 지시한 트레이드오프다.**

| 포기하는 것 | 영향 |
|---|---|
| 검색 유입 | 본문이 색인되지 않는다. 검색 트래픽은 상품명·요약 설명·리뷰 영역에 전적으로 의존 |
| 접근성 | 스크린리더 사용자는 페이지 내용을 얻을 수 없다. `alt`가 일련번호뿐이라 이미지 설명도 없다 |
| AI 크롤러 | 생성형 검색·쇼핑 에이전트가 제품 정보를 추출하지 못한다 |
| Ctrl+F | 페이지 내 검색 불가 |

**"SEO를 위해 alt에 설명을 넣자" "제목만이라도 텍스트로 두자"는 제안을 하지 않는다.**

완화책은 페이지 **바깥**에 있다 — 채널 상품 등록 시:
1. 상품명·요약설명·옵션명에 핵심 키워드(글루타치온·콜라겐·필오프팩·700ppm) 배치
2. 상품 고시정보/전성분 필드를 텍스트로 충실히 입력
3. FAQ·사용법을 판매 채널의 별도 텍스트 필드에도 중복 기재

벤치마크(메디힐)도 정확히 이 구조이며 동일한 비용을 지불하고 있다.
그 부분이 걱정되면 게시 담당자에게 **채널 등록 시 텍스트 필드 보완**을 코멘트로 남긴다. 마크업은 건드리지 않는다.
