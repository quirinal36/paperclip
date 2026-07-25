# KOREAN-LOCALIZATION.md — UI 한글화 작업 가이드

> **이 문서는 fork 전용입니다.** upstream(`paperclipai/paperclip`)에는 없는 파일이라
> upstream을 당겨와도 충돌나지 않습니다. `ui/`의 화면을 **화면 단위로 한국어화**하는
> 작업을 다른 세션에서도 이어서 할 수 있도록, 지금까지의 구조·결정·절차를 정리한 문서입니다.
>
> 관련: 루트 [FORK.md](../FORK.md) (fork 유지·확장 전반)

---

## 0. 30초 요약 (한 화면 한글화 레시피)

1. 대상 컴포넌트에서 **하드코딩된 영어 문자열**을 찾는다.
2. 각 문자열을 `t("네임스페이스.키", { defaultValue: "원래 영어" })` 로 감싼다.
   - 컴포넌트라면 `const { t } = useTranslation();`
   - 컴포넌트 밖(유틸 등)이라면 `import { t } from "@/i18n";`
3. 그 키들을 **`en.json`(원문)** 과 **`ko.json`(번역)** 두 파일에만 추가한다. **나머지 38개 언어 파일은 손대지 않는다.**
4. `pnpm exec tsc -b` + 관련 vitest 통과 확인.
5. 우측 상단 🌐 스위처(또는 브라우저 언어)로 한국어 확인.

> 핵심 원리: 번역이 없는 키는 i18next가 **자동으로 영어로 폴백**한다. 그래서 `ko.json`만
> 점진적으로 채우면 되고, `defaultValue`가 있으니 영어 화면과 테스트도 안 깨진다.

---

## 1. 현재 상태 (2026-07 기준)

- **완료:**
  - 로그인·회원가입 화면(`/auth`). 키 네임스페이스 `auth.*` + 전역 `language.*`.
  - **계정 메뉴**(`SidebarAccountMenu`) 전체 — `account.*`. 테마 토글(`theme.*`)·언어 스위처 행 포함.
- **기반 인프라(완료):**
  - 언어 저장(localStorage) + 브라우저 언어 감지 + 영어 폴백
  - 언어 전환 UI(`LanguageSwitcher`) — `icon` 변형(`/auth` 우측 상단) + `menu-action` 변형(계정 메뉴).
    **로그인 이후에도 계정 메뉴에서 언어 전환 가능.**
  - 로케일 검증기 완화(누락 키 허용) → 화면 단위 점진 번역 가능
- **아직 안 된 것:** `/auth`·계정 메뉴 외 대부분 화면은 영어 하드코딩(사이드바 내비, 회사 생성/설정,
  이슈/대시보드/인박스 등).

upstream 원본은 i18n **골격만** 있었다(빈 40개 언어 파일 + `app.noCompanies` 한 화면, 스위처 없음,
`lng` 고정). 우리가 그 위에 실제 한글화를 얹는 중이다.

---

## 2. 파일 지도

| 파일 | 역할 |
| --- | --- |
| [ui/src/i18n/index.ts](../ui/src/i18n/index.ts) | i18next 초기화. `t`, `useTranslation`, `getLocale`, `setLocale`, `supportedLocales`, `DEFAULT_LOCALE` 내보냄. 초기 언어 결정(저장→브라우저→en), `paperclip.locale` 키로 저장. |
| [ui/src/i18n/locales.ts](../ui/src/i18n/locales.ts) | `locales/*.json`을 glob으로 로드해 i18next 리소스로 변환. `supportedLocales` 목록 생성. |
| [ui/src/i18n/locales/en.json](../ui/src/i18n/locales/en.json) | **원문(source of truth).** 모든 키가 여기 정의돼 있어야 함. |
| [ui/src/i18n/locales/ko.json](../ui/src/i18n/locales/ko.json) | **한국어 번역.** en.json의 부분집합(번역한 것만). |
| ...locales/`*.json` (38개) | 다른 언어들. **건드리지 않음** — 없는 키는 영어로 폴백. |
| [ui/src/i18n/locale-validation.ts](../ui/src/i18n/locale-validation.ts) | 로드 시 각 로케일을 en 기준으로 검증. |
| [ui/src/components/LanguageSwitcher.tsx](../ui/src/components/LanguageSwitcher.tsx) | 언어 전환 드롭다운(아이콘 버튼). |
| [ui/src/pages/Auth.tsx](../ui/src/pages/Auth.tsx) | 이미 한글화된 참고용 예시. |

---

## 3. 동작 원리 (알아둘 것만)

- **언어 선택 우선순위:** localStorage(`paperclip.locale`) → 브라우저 언어(`navigator.languages`) → `en`.
- **폴백:** `fallbackLng: "en"`. `ko.json`에 키가 없으면 자동으로 `en.json` 값 사용.
- **전환:** `setLocale("ko")` 호출 → i18next 언어 변경 + localStorage 저장 + `<html lang>` 갱신.
  `useTranslation()`을 쓰는 컴포넌트는 자동 리렌더.
- **`t()` 두 가지 형태:**
  - 컴포넌트: `const { t } = useTranslation();` → JSX에서 `t(...)`. (리렌더 반응)
  - 비컴포넌트: `import { t } from "@/i18n";` → 어디서나 `t(...)`. (일회성 문자열)

---

## 4. 화면 하나 한글화하기 — 단계별

### 4-1. 문자열 찾기
대상 파일에서 사용자에게 보이는 영어 텍스트(제목, 라벨, 버튼, placeholder, `aria-label`,
`title`, 토스트/에러 메시지 등)를 찾는다.

```bash
# 대략적인 후보 스캔 (JSX 텍스트/따옴표 문자열)
cd ui/src && grep -nE ">[A-Z][a-z].+<|\"[A-Z][a-z].+\"" pages/대상.tsx
```

### 4-2. `t()`로 감싸기
`useTranslation`을 불러오고, 각 문자열을 `defaultValue` 포함해 교체한다.

```tsx
// before
<h1>Sign in to Paperclip</h1>

// after
import { useTranslation } from "@/i18n";
// ...
const { t } = useTranslation();
// ...
<h1>{t("auth.signIn.title", { defaultValue: "Sign in to Paperclip" })}</h1>
```

> **`defaultValue`는 항상 넣는다.** 이유:
> ① 키가 아직 en.json에 없어도 화면이 안 깨진다.
> ② en 로케일에서 정확히 그 영어가 렌더되므로, 영어 문자열을 검사하는 기존 테스트가 계속 통과한다.
> (기존 `App.tsx`도 이 패턴을 씀.)

### 4-3. 키를 en.json + ko.json에 추가
en.json에 원문을, ko.json에 번역을 **같은 구조**로 추가한다. 다른 파일은 놔둔다.

```jsonc
// en.json
"issues": {
  "title": "Issues",
  "empty": "No issues yet",
  "newIssue": "New issue"
}
// ko.json
"issues": {
  "title": "이슈",
  "empty": "아직 이슈가 없습니다",
  "newIssue": "새 이슈"
}
```

### 4-4. 키 네이밍 규칙
- **화면/도메인 단위 네임스페이스**로 묶는다: `auth.*`, `issues.*`, `companies.*` …
- 계층은 의미 단위로: `auth.signIn.title`, `auth.fields.email`, `auth.actions.createAccount`,
  `auth.errors.generic`.
- 여러 화면이 공유하는 범용 문구는 `common.*`(예: `common.save`, `common.cancel`, `common.loading`)로
  모아 재사용.
- 브랜드명(`Paperclip`)은 번역하지 않는다.

### 4-5. 변수 보간(interpolation)
동적 값은 `{{name}}` 구문을 쓰고, **en과 ko의 placeholder 집합이 정확히 일치해야 한다**(검증 규칙).

```tsx
t("invite.sentTo", { defaultValue: "Invited {{email}}", email });
```
```jsonc
// en.json → "invite": { "sentTo": "Invited {{email}}" }
// ko.json → "invite": { "sentTo": "{{email}} 님을 초대했습니다" }   // 위치는 달라도 됨, placeholder 이름/개수는 동일
```

### 4-6. 언어 전환 진입점(필요 시)
전역 전환은 이미 동작한다(스위처가 `setLocale` 호출 → 저장). 특정 화면 헤더에 스위처를 두려면:

```tsx
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
// ...
<LanguageSwitcher />
```

> **완료된 예시:** 계정 메뉴([ui/src/components/SidebarAccountMenu.tsx](../ui/src/components/SidebarAccountMenu.tsx))에
> `<LanguageSwitcher variant="menu-action" onAfterChange={() => setOpen(false)} />`를 `ThemeToggle` 옆에
> 장착했다. `menu-action` 변형은 전체폭 행(아이콘+라벨+현재 언어명)으로, 계정 메뉴의 `MenuAction`
> 행들과 시각적으로 맞춘다. Radix `DismissableLayer`가 중첩 오버레이(Popover 안의 DropdownMenu)를
> 올바르게 처리하므로 팝오버가 먼저 닫히는 문제는 없다.

---

## 5. 검증 규칙 / 제약 (locale-validation)

로드 시 각 로케일을 en 기준으로 검사한다. **완화 후** 규칙:

- ✅ **누락 키 허용** — ko가 en의 부분집합이어도 OK(영어 폴백).
- ❌ **잉여 키 금지** — en에 없는 키가 ko에 있으면 에러(오타/삭제 잔재 방지).
- ❌ **placeholder 불일치 금지** — `{{...}}` 이름/개수가 en과 달라도 에러.
- ❌ **주입/원본에 없던 것 금지** — `<script>`, 이벤트 핸들러 속성, `javascript:`, `data:`,
  raw HTML 태그, en엔 없던 URL.
- ❌ **과도한 길이 금지** — en 대비 약 4배 초과 시 에러.

> 이 완화는 upstream과 다른 우리 fork의 결정이다([locale-validation.ts](../ui/src/i18n/locale-validation.ts)
> 와 그 테스트에 반영). upstream 동기화 시 이 파일에서 충돌 가능성이 있으니, 병합 때
> "누락 키 허용" 동작을 유지하도록 주의.

---

## 6. 검증(테스트) 명령

```bash
cd ui

# 타입체크 (이게 정식. tsc --noEmit 아님)
pnpm exec tsc -b

# 관련 유닛 테스트
pnpm exec vitest run src/i18n/locale-validation.test.ts src/pages/대상.test.tsx
```

- 이 저장소에는 eslint/biome 린트 스크립트가 없다. **typecheck + vitest가 게이트.**
- 영어 문자열을 직접 검사하는 테스트가 있으면, `defaultValue`가 en 값과 동일한지 확인
  (같으면 en 로케일에서 통과).

### 화면 미리보기(로그인 후 화면 포함)
- 로그인/회원가입(`/auth`) 화면을 보려면 **인증 모드**가 필요 → `pnpm dev --bind lan`
  (그냥 `pnpm dev`는 `local_trusted`라 `/auth`가 안 뜸).
- SSH 원격 개발이면 **VS Code 포트 포워딩**(포트 3100)으로 Windows에서
  `http://localhost:3100` 접속이 가장 간단(방화벽·호스트가드 불필요).
- 자세한 네트워크/바인딩 배경은 별도 세션 기록 참고. 요점만: dev는 **UI가 API 서버(3100)에
  Vite 미들웨어로 통합**되어 포트가 3100 하나다.

---

## 7. 흔한 함정

- **`defaultValue` 빠뜨리기** → 키 미정의 시 키 문자열 그대로 노출. 항상 넣기.
- **다른 38개 언어 파일 수정** → 불필요. en + ko만.
- **en.json에 안 넣고 ko.json에만 추가** → "en에 없는 잉여 키" 에러. 항상 en 먼저.
- **placeholder 불일치** → 검증 에러. en과 ko의 `{{var}}` 이름/개수 동일하게.
- **JSX 안의 마크업을 통째로 번역 문자열에 넣기** → raw HTML 금지 규칙에 걸림. 마크업은
  JSX에 남기고 텍스트 조각만 `t()`로. (링크/강조가 섞인 문장은 `<Trans>` 컴포넌트 사용을 고려하되,
  현재는 미도입 — 필요해지면 이 문서에 패턴 추가.)
- **복수형/성별** 등 고급 처리 필요 시 i18next plural 기능을 쓰되, en/ko 양쪽 키 세트를 맞춰야 함.

---

## 8. 다음 후보 화면 (우선순위 제안)

로그인 직후 눈에 띄는 순서로:

1. **온보딩/빈 상태** — `app.noCompanies`(일부 됨) 확장, [ui/src/components/EmptyState.tsx](../ui/src/components/EmptyState.tsx)
2. **전역 셸** — 사이드바/내비게이션. (계정 메뉴 + 언어 스위처 장착은 ✅ 완료.)
3. **회사 생성/설정** — [pages/Companies.tsx](../ui/src/pages/Companies.tsx), [pages/CompanySettings.tsx](../ui/src/pages/CompanySettings.tsx)
4. **핵심 작업 화면** — [pages/Issues.tsx](../ui/src/pages/Issues.tsx), [pages/IssueDetail.tsx](../ui/src/pages/IssueDetail.tsx), [pages/Dashboard.tsx](../ui/src/pages/Dashboard.tsx), [pages/Inbox.tsx](../ui/src/pages/Inbox.tsx)

> 한 번에 한 화면씩. 각 화면은 en+ko 두 파일 + 컴포넌트 하나(대개)만 바뀌므로 리뷰가 쉽다.

---

## 9. 커밋/PR 관례

- fork의 커스텀 브랜치(`custom/*`)에서 작업. 화면 단위로 작은 커밋.
- 커밋 메시지는 무엇을 한글화했는지 명시(예: `i18n(ko): localize issues list screen`).
- upstream 코어 파일을 최소한으로 건드리는 원칙은 [FORK.md](../FORK.md) 참고. i18n는 이미
  upstream이 깔아둔 구조 위에 **데이터(json)와 소량의 배선**만 얹는 방식이라 충돌 위험이 낮다.
  단, [locale-validation.ts](../ui/src/i18n/locale-validation.ts)는 우리가 동작을 바꾼 파일이므로
  동기화 시 주의(5절 참고).
