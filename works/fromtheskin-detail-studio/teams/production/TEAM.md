---
kind: team
name: 제작실
slug: production
description: HyperFrames 합성·렌더부터 슬라이싱·마크업까지 최종 산출물을 만드는 팀
manager: ../../agents/compositor/AGENTS.md
includes:
  - ../../agents/publisher/AGENTS.md
  - ../../skills/hyperframes-render/SKILL.md
  - ../../skills/slice-and-markup/SKILL.md
  - ../../skills/page-blueprint/SKILL.md
tags:
  - production
  - hyperframes
---

# 제작실

**확정된 것들을 물건으로 만든다.** 판(plate) · 카피 · 수치가 전부 확정된 뒤에 움직인다.

```
P0 통과 → compositor : HTML 컴포지션 → snapshot(PNG 18) / render(MP4 6)
                            ↓ split_bands
                      publisher : 슬라이싱 → 인코딩 → 마크업 → 용량 검증
```

## 이 팀의 규율 두 가지

### 1. 결정된 것을 바꾸지 않는다

카피가 어색해 보여도 고치지 않는다. 수치가 밋밋해 보여도 키우지 않는다.
그 문장들은 심의실을 통과한 것이고, 여기서 한 글자 바꾸면 **다시 통과해야 한다.**
고칠 이유가 있으면 되돌린다 — 조용히 손보지 않는다.

### 2. 파일이 없으면 완료가 아니다

`index.html`이 있다고 완성이 아니다. **PNG와 MP4가 실제로 존재해야 완성이다.**
컴포지션이 `lint`를 통과했다는 것과 `snapshot`이 파일을 뱉었다는 것은 다른 사건이다.

## 두 사람 사이의 계약 — `split_bands`

컴포지션 엔지니어는 **분할 예정선에 여백 밴드를 미리 확보하고** 그 좌표를 넘긴다.
퍼블리싱 엔지니어는 그 좌표대로만 자른다.

좌표가 없거나 그 자리에 여백이 없으면 **자르지 않고 되돌린다.**
임의로 자르면 슬라이스 경계에서 글자가 잘리거나 얼굴이 두 동강 난다 — 이건 렌더 사고이지 취향 문제가 아니다.
