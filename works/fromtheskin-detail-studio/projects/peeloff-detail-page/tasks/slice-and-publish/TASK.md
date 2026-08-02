---
kind: task
name: 슬라이싱 · 인코딩 · 마크업
assignee: publisher
project: peeloff-detail-page
priority: high
---

# 슬라이싱 · 인코딩 · 마크업

`render_output`의 PNG·MP4를 쇼핑몰에 붙일 수 있는 마크업으로 만든다.

## 절차

1. **슬라이싱** — PNG를 1020px로 다운샘플 후 `split_bands` 좌표대로 세로 분할. `b{블록}_{슬라이스}` 명명
2. **인코딩** — 사진 비중 高 JPEG q82 / 타이포·단색 高 PNG. 영상은 오디오 스트림 제거
3. **마크업** — 첫 이미지만 `src`, 나머지 전부 `data-src` lazy
4. **검수** — 아래 전부 실제로 실행해 확인

```bash
ffmpeg -i in.mp4 -an -c:v libx264 -crf 23 -vf scale=1020:-2 -r 30 -pix_fmt yuv420p out.mp4
ffprobe -v error -show_entries stream=codec_type -of csv=p=0 out.mp4   # video 만
```

## 검수 체크리스트

- [ ] `innerText.length === 0`
- [ ] 모든 `alt`가 `프롬더스킨 글루타치온 콜라겐 필오프팩 {일련번호}` 형식
- [ ] 첫 이미지만 즉시 로드, 나머지 lazy
- [ ] 모든 영상에 오디오 스트림 없음
- [ ] 이미지 ≤6MB / 영상 ≤8MB / 총 ≤14MB
- [ ] **24블록이 전부 들어갔고** 순서가 `block_inventory`와 일치
- [ ] `publishable: false` 명시 · 파일명 `detail_pilot.html` · 출력 `out/pilot/`
- [ ] 빈칸(`pending`) 자리가 슬라이스 경계에 걸려 잘리지 않음
- [ ] 슬라이스 경계가 텍스트·얼굴을 가로지르지 않음 — **이미지를 열어 눈으로 확인**
- [ ] 영상 래퍼에 `line-height:0; font-size:0px`

## 되돌리는 경우

- `split_bands`가 없거나 그 자리에 여백이 없다 → **자르지 말고** compositor에게 되돌린다
- 용량이 예산을 넘는다 → **화질을 임의로 낮추지 말고** 어느 블록이 얼마나 넘었는지 적어 되돌린다

## 완료 조건

`page_markup`이 작성되고 검수 전 항목이 통과한다.
그 뒤 **심의 담당관에게 전체 인상 판정을 요청**한다. 그게 마지막 관문이다.
