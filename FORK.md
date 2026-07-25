# FORK.md — 이 fork를 유지·확장하기 위한 가이드

> 이 문서는 **다운스트림(fork) 전용** 문서입니다. 원본(`paperclipai/paperclip`)에는
> 존재하지 않는 파일이므로 upstream을 아무리 당겨와도 **충돌나지 않습니다.**
> 앞으로 이 디렉터리에서 작업할 때의 기준 문서로 삼으세요.

---

## 0. 한 줄 요약

Paperclip은 **"포크 없이 확장(extend without forking)"**을 1급으로 지원한다.
커스텀 기능은 가능한 한 **repo 바깥의 플러그인**이나 **어댑터**로 만들고,
`server/`·`ui/` 같은 **코어는 되도록 건드리지 않는다.**
그러면 upstream 최신화가 거의 충돌 없이 굴러간다.

---

## 1. 현재 상태 (작성 시점 기준)

- `origin` = `https://github.com/paperclipai/paperclip.git` — **원본을 직접 클론한 상태 (아직 fork 아님)**
- `upstream` remote 없음
- 로컬 `master`가 `origin/master`보다 뒤처져 있었음 (최초 확인 시 521 커밋)

> ⚠️ 즉, 지금 구조에서는 "내 fork"와 "원본"이 분리되어 있지 않다.
> 아래 2번으로 **fork ↔ upstream 구조부터 갖추는 것**이 첫걸음이다.

---

## 2. Fork 구조 갖추기 (최초 1회)

### 2-1. GitHub에서 fork 생성
`github.com/paperclipai/paperclip` → **Fork** 버튼 → 내 계정(`quirinal36`)으로 fork.

### 2-2. remote 재구성
`origin`을 **내 fork**로, `upstream`을 **원본**으로 맞춘다.

```bash
# origin을 내 fork로 교체
git remote set-url origin https://github.com/quirinal36/paperclip.git

# 원본을 upstream으로 추가
git remote add upstream https://github.com/paperclipai/paperclip.git

# 확인: origin=내 fork(fetch/push), upstream=원본(fetch)
git remote -v
```

> upstream은 fetch만 하고 push하지 않는다. 실수로 원본에 push하지 않도록
> push URL을 막아두면 더 안전하다:
> ```bash
> git remote set-url --push upstream DISABLE
> ```

### 2-3. 첫 동기화
```bash
git fetch upstream
git checkout master
git merge --ff-only upstream/master   # 로컬에 커스텀 커밋이 없다면 fast-forward로 최신화
git push origin master
```

---

## 3. Upstream 최신화 워크플로우 (반복)

**주기: 원본 릴리스마다 또는 주 1회.** 자주 할수록 각 병합이 작고 쉽다. 미룰수록 충돌이 쌓인다.

```bash
git fetch upstream
git checkout master
git merge --ff-only upstream/master   # master는 항상 upstream을 그대로 반영 (fast-forward 전용)
git push origin master
```

- `master`는 **upstream 미러 전용**으로 쓴다. 여기에 직접 커밋하지 않는다.
- 커스텀 작업은 별도 브랜치(`custom/*`)에서 하고, 최신화 후 rebase로 얹는다:

```bash
git checkout custom/main
git rebase master        # 내 커스텀 커밋을 최신 upstream 위로 재배치
# 충돌나면 해결 → git add → git rebase --continue
git push --force-with-lease origin custom/main
```

### merge vs rebase
| | 언제 |
|---|---|
| **rebase** | 혼자 쓰는 커스텀 브랜치. 히스토리가 깨끗하고 "내 변경분"이 명확. (권장) |
| **merge** | 여러 명이 공유하는 브랜치. force push 없이 안전. |

---

## 4. ⭐ 커스텀 기능을 어디에 둘 것인가 (충돌 최소화의 핵심)

유지보수 난이도는 **"내 코드가 코어 파일과 얼마나 겹치느냐"**로 거의 결정된다.
아래 순서대로 위쪽을 우선한다.

### 4-1. 플러그인 (1순위 · 충돌 위험 0)

플러그인은 **repo 바깥의 독립 폴더**에서 개발하고 로컬 경로로 설치한다.
파일이 이 저장소 안에 들어오지 않으므로 upstream과 **절대 충돌하지 않는다.**

```bash
# 1) Paperclip 실행
pnpm paperclipai run

# 2) repo 바깥에 플러그인 스캐폴드
paperclipai plugin init @quirinal36/my-plugin --output ~/dev/paperclip-plugins

# 3) 워치 빌드
cd ~/dev/paperclip-plugins/my-plugin
pnpm install && pnpm dev

# 4) 절대경로로 설치 (다른 터미널에서)
paperclipai plugin install ~/dev/paperclip-plugins/my-plugin

# 5) 확인
paperclipai plugin list
paperclipai plugin inspect quirinal36.my-plugin
```

- 참고 문서: [`doc/plugins/LOCAL_PLUGIN_DEVELOPMENT.md`](doc/plugins/LOCAL_PLUGIN_DEVELOPMENT.md),
  [`doc/plugins/PLUGIN_AUTHORING_GUIDE.md`](doc/plugins/PLUGIN_AUTHORING_GUIDE.md),
  [`doc/plugins/PLUGIN_SPEC.md`](doc/plugins/PLUGIN_SPEC.md)
- 예제: `packages/plugins/examples/`
  (`paperclipai plugin examples`로 목록 확인)
- 플러그인이 할 수 있는 것: worker 액션, managed agents/projects/routines/skills,
  UI 슬롯 기여, scoped API 라우트, 플러그인 전용 DB 네임스페이스.
- 주기적/백그라운드 작업은 자체 프로세스 루프 대신 **managed routine**으로 모델링한다
  (운영자에게 보이는 작업·예산·일시정지·감사가 붙는다).

> **결론: 새 기능은 "플러그인으로 만들 수 있는가?"를 먼저 묻는다.
> 가능하면 무조건 플러그인.**

### 4-2. 어댑터 (2순위 · 새 에이전트 런타임을 붙일 때)

새로운 에이전트 런타임(예: 사내 봇, 특정 CLI)을 연결하려면 어댑터를 만든다.
런타임 어댑터 레지스트리가 있어 등록/해제가 가능하다.

- 저작 가이드: [`packages/adapters/AUTHORING.md`](packages/adapters/AUTHORING.md),
  [`docs/adapters/creating-an-adapter.md`](docs/adapters/creating-an-adapter.md)
- 등록 API: `registerServerAdapter` / `registerUIAdapter`
  (`server/src/adapters/`, `ui/src/adapters/`)
- 기존 예시: `packages/adapters/*` (claude-local, codex-local, cursor-local 등)
- **불변식**: 어댑터 런타임 코드에서 `git push` 금지, `git remote` 존재를 가정하지 말 것.
  크로스-런 상태는 Paperclip이 넘겨준 로컬 cwd로만 주고받는다
  (`scripts/check-no-git-push.mjs`가 CI에서 강제). 자세한 규칙은 AUTHORING.md 참고.

> 가능하면 어댑터도 **플러그인이 기여하는 형태**로 만들어 repo 밖에 두는 것을 우선한다.

### 4-3. 스킬 / 컴퍼니 설정 (3순위 · 코드가 아닌 구성)

- 에이전트 스킬, 회사/조직 구성은 export/import와 catalog로 관리된다
  (`skills/`, `packages/skills-catalog`, `packages/teams-catalog`).
- 이런 "구성" 성격의 커스터마이즈는 코드 병합과 무관하게 별도 관리 가능.

### 4-4. 코어를 반드시 고쳐야 할 때 (최후의 수단)

`server/`·`ui/`·`packages/shared`를 직접 고쳐야 한다면, **충돌을 최소화하는 규칙**을 지킨다:

1. **최소·국소 변경.** 넓게 흩뿌리지 말고 한 곳에 모은다.
2. **새 파일로 분리.** 기존 파일 수정보다 새 파일 추가가 훨씬 충돌에 강하다.
3. **표시(marker)를 남긴다.** rebase 때 내 변경을 빠르게 식별하도록:
   ```ts
   // FORK-CUSTOM(quirinal36): 왜 이 변경이 필요한지 한 줄 이유
   ```
   나중에 `git grep "FORK-CUSTOM"`으로 커스텀 지점을 전부 찾을 수 있다.
4. **커밋을 작게, 주제별로.** rebase 충돌 해결이 쉬워진다.
5. **upstream에 올릴 수 있는 버그 수정/개선이면 PR로 기여**한다.
   원본에 흡수되면 내가 유지할 diff가 줄어든다.

---

## 5. 브랜치 전략

```
master            ← upstream 미러 (직접 커밋 금지, fast-forward만)
custom/main       ← 내 커스텀의 통합 브랜치 (master 위로 rebase)
custom/<feature>  ← 개별 기능 작업 브랜치 → custom/main으로 병합
```

- 배포/실행은 `custom/main`(또는 그 릴리스 태그)에서.
- `master`는 오직 upstream을 따라가는 용도.

---

## 6. 유지보수 체크리스트

**정기(주 1회 또는 릴리스마다):**
- [ ] `git fetch upstream`
- [ ] `master`를 `upstream/master`로 fast-forward → `git push origin master`
- [ ] `custom/main`을 `master` 위로 rebase, 충돌 해결
- [ ] `pnpm install` (lockfile 갱신 반영)
- [ ] `pnpm typecheck && pnpm test` 통과 확인
- [ ] 플러그인/어댑터가 여전히 로드되는지 확인 (`paperclipai plugin list`)

**기능 추가 시:**
- [ ] "플러그인으로 가능한가?" 먼저 묻기 → 가능하면 플러그인 (4-1)
- [ ] 코어 수정이 불가피하면 `// FORK-CUSTOM(...)` 마커 + 최소 변경 (4-4)

---

## 7. Do / Don't

**Do**
- ✅ 커스텀은 **플러그인·어댑터로 repo 밖에** 두기
- ✅ upstream을 **자주** 당겨오기
- ✅ 코어 수정은 최소화 + `FORK-CUSTOM` 마커
- ✅ 범용 버그 수정은 upstream에 PR

**Don't**
- ❌ `master`에 직접 커밋 (upstream 미러 전용)
- ❌ `upstream`에 push
- ❌ 코어 파일을 넓게 수정 (rebase 지옥의 원인)
- ❌ 어댑터/런타임 코드에서 `git push` 또는 `git remote` 의존
- ❌ 원본 파일(`AGENTS.md`, `README.md` 등)에 fork 전용 설명 추가 → 대신 이 `FORK.md`에

---

## 8. 하드 포크(동기화 중단)를 고려할 때

아래에 해당하면 upstream 추종을 끊는 편이 나을 수 있다:
- 원본이 사실상 방치/중단됨
- 내가 원본과 **완전히 다른 방향의 제품**으로 발전 (철학·구조가 갈라짐)
- upstream 변경이 내 커스텀과 근본적으로 충돌해 병합 비용 > 이득

그 전까지는 **보안 패치·버그 수정 때문에 계속 받는 것이 거의 항상 이득**이다.

---

## 참고 문서 (repo 내부)

- **UI 한글화(ko) 작업**: [`doc/KOREAN-LOCALIZATION.md`](doc/KOREAN-LOCALIZATION.md) — 화면 단위 한글화 절차·규칙·다음 후보 (fork 전용)
- 개발 전반: [`doc/DEVELOPING.md`](doc/DEVELOPING.md)
- 플러그인: [`doc/plugins/`](doc/plugins/)
- 어댑터: [`packages/adapters/AUTHORING.md`](packages/adapters/AUTHORING.md), [`docs/adapters/`](docs/adapters/)
- 기여 가이드: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 에이전트용 규약: [`AGENTS.md`](AGENTS.md)
