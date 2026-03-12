# 오뉴 작업 로그

---

## 2026-03-12 | 어드민 대시보드 버그 수정 및 배포 자동화

### 요청 사항
- `https://opinion-newsletter-web-810426728503.us-central1.run.app/admin` 접속 불가 문제 확인 및 수정

---

### 원인 분석

#### 1. 서비스 URL 불일치 (접속 불가 주원인)

이전 세션(`660e90e`)에서 Cloud Run 서비스 이름과 리전이 변경되었으나, 사용자는 구 URL로 계속 접속 시도 중이었음.

| | 구 URL (접속 불가) | 신 URL (정상) |
|---|---|---|
| 서비스명 | `opinion-newsletter-web` | `opinionnewsletter-web` |
| 리전 | `us-central1` | `asia-northeast3` |
| URL | `opinion-newsletter-web-810426728503.us-central1.run.app` | `opinionnewsletter-web-810426728503.asia-northeast3.run.app` |

#### 2. 로그아웃 버튼 완전 미작동 (Critical 버그)

`admin_session` 쿠키가 `httpOnly: true`로 설정된 상태에서, 기존 `handleLogout`이 JavaScript의 `document.cookie`로 쿠키를 삭제하려 했으나 브라우저가 `httpOnly` 쿠키에 대한 JS 접근을 차단하므로 로그아웃이 전혀 동작하지 않음.

```javascript
// Before (동작 안 함 - httpOnly 쿠키는 JS에서 삭제 불가)
document.cookie = 'admin_session=; Max-Age=0; path=/; SameSite=Strict;';

// After (서버 API를 통해 삭제)
await fetch('/api/admin/logout', { method: 'POST' });
```

#### 3. 기타 버그들

- 이미 로그인된 사용자가 `/admin` 재방문 시 로그인 폼 재노출 (UX 문제)
- 통계 탭 빈 상태 행의 `colSpan={6}` → 실제 7컬럼 테이블
- 분석 탭 `recipient_count === 0`일 때 `NaN%` 표시

---

### 수정 내용

#### 1. `/api/admin/logout` 라우트 신규 추가
`web/app/api/admin/logout/route.ts` 생성 — 서버 측에서 `admin_session` 쿠키 만료 처리

#### 2. `handleLogout` 함수 수정
`web/app/admin/dashboard/page.tsx` — `document.cookie` 방식 제거, `/api/admin/logout` POST 호출로 변경

#### 3. 로그인 페이지 인증 상태 자동 감지
`web/app/admin/page.tsx` — `useEffect`로 `/api/admin/subscribers` 호출, 세션 유효 시 `/admin/dashboard`로 자동 리다이렉트

#### 4. `colSpan` 버그 수정
`web/app/admin/dashboard/page.tsx` 통계 탭 빈 상태 `colSpan={6}` → `colSpan={7}`

#### 5. Division by zero 방지
`web/app/admin/dashboard/page.tsx` 분석 탭 오픈율·클릭률 계산 시 `recipient_count > 0` 가드 추가

#### 6. GitHub Actions 자동 배포 워크플로우 추가
`.github/workflows/deploy.yml` 생성 — `main`/`master` 브랜치 push 시 Cloud Run(`asia-northeast3`) 자동 배포

---

### 배포 절차

#### GitHub Actions 자동 배포 (최초 1회 설정)

GitHub 저장소 → **Settings → Secrets and variables → Actions** → 아래 6개 Secret 등록:

| Secret | 내용 |
|--------|------|
| `GCP_SERVICE_ACCOUNT_KEY` | GCP 서비스 계정 JSON 키 |
| `GMAIL_USER` | Gmail 주소 |
| `GMAIL_APP_PASSWORD` | Gmail 앱 비밀번호 |
| `ENCRYPTION_KEY` | 32자리 암호화 키 |
| `ADMIN_PASSWORD` | 어드민 로그인 비밀번호 |
| `CRON_SECRET` | 자동 발송용 시크릿 |

설정 완료 후 main에 머지하면 자동 배포됨.

#### 어드민 접속 URL (배포 후)
```
https://opinionnewsletter-web-810426728503.asia-northeast3.run.app/admin
```

---

### 관련 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `web/app/api/admin/logout/route.ts` | 신규 | 서버 측 로그아웃 API |
| `web/app/admin/dashboard/page.tsx` | 수정 | 로그아웃·colSpan·NaN% 버그 수정 |
| `web/app/admin/page.tsx` | 수정 | 인증 상태 감지 및 자동 리다이렉트 |
| `.github/workflows/deploy.yml` | 신규 | Cloud Run 자동 배포 워크플로우 |

### 관련 커밋

| 커밋 | 설명 |
|------|------|
| `363d677` | fix: admin 대시보드 주요 버그 수정 (로그아웃·colSpan·NaN%) |
| `3d93222` | ci: GitHub Actions 자동 배포 워크플로우 추가 |

---

## 2026-03-12 | 어드민 구독자 목록 이메일 "error" 표시 버그 수정 및 암호화 키 마이그레이션

### 증상

어드민 대시보드(`/admin/dashboard`) 구독자 목록에서 모든 구독자의 이메일이 실제 마스킹된 이메일 대신 `error`로 표시됨.

```
이메일(마스킹)    가입일                    상태
error            2026년 2월 8일 오전 09:22   ACTIVE
error            2026년 2월 3일 오후 04:20   ACTIVE
error TEST       2026년 2월 1일 오전 12:54   ACTIVE
error TEST       2026년 2월 1일 오전 12:50   ACTIVE
```

---

### 원인 분석

**관련 커밋**: `d632d65` (2026-02-11) — "Security: comprehensive frontend and admin security hardening"

보안 강화 작업에서 `web/lib/crypto.ts`의 하드코딩된 기본 암호화 키 폴백이 제거됨:

```diff
// Before (d632d65 이전)
- const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';

// After (d632d65 이후)
+ const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
```

기존 구독자 4명은 모두 보안 강화 커밋 **이전**(2026-02-01 ~ 2026-02-08)에 가입하여 구 기본 키로 암호화 저장되어 있었음.

**실패 흐름**:
1. `decryptEmail(data.email)` 호출 시 `ENCRYPTION_KEY` 환경변수 없음 → 예외 발생 → `null` 반환
2. `maskEmail(null || 'error')` = `maskEmail('error')`
3. `maskEmail('error')`: `'error'`에는 `@`가 없으므로 `if (!domain) return email` 분기 → `'error'` 반환
4. 프론트엔드에 `error` 표시

---

### 수정 내용

#### 1. `web/lib/crypto.ts` — LEGACY_ENCRYPTION_KEY 폴백 지원

```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const LEGACY_ENCRYPTION_KEY = process.env.LEGACY_ENCRYPTION_KEY;  // 추가

function tryDecryptWithKey(text: string, key: string): string | null { ... }  // 추가

export function decryptEmail(text: string) {
    if (!text.includes(':')) return text;

    // 1순위: 현재 ENCRYPTION_KEY로 복호화 시도
    if (ENCRYPTION_KEY) {
        const result = tryDecryptWithKey(text, ENCRYPTION_KEY);
        if (result !== null) return result;
    }

    // 2순위: LEGACY_ENCRYPTION_KEY 폴백 (키 교체 전 암호화된 데이터 호환)
    if (LEGACY_ENCRYPTION_KEY) {
        const result = tryDecryptWithKey(text, LEGACY_ENCRYPTION_KEY);
        if (result !== null) return result;
    }

    console.error("Decryption failed with all available keys");
    return null;
}
```

#### 2. `web/app/api/admin/migrate-encryption/route.ts` — 재암호화 API 엔드포인트 추가

- `POST /api/admin/migrate-encryption` (어드민 세션 인증 필요)
- Firestore의 모든 구독자 이메일을 현재 `ENCRYPTION_KEY`로 재암호화
- 응답: `{ success: true, migrated: N, failed: N, total: N }`

#### 3. `web/scripts/migrate-encryption.js` — 로컬/CLI 마이그레이션 스크립트 추가

- Node.js로 직접 실행 가능 (Firebase Admin SDK 사용)
- 구 키(`LEGACY_ENCRYPTION_KEY`) → 신 키(`ENCRYPTION_KEY`) 재암호화
- 이미 새 키로 암호화된 레코드는 자동으로 건너뜀

---

### 새 암호화 키

| 항목 | 값 |
|------|-----|
| **새 ENCRYPTION_KEY** | `caa19df32a1a1aaf556ce6227a3b3360` |
| **구 LEGACY_ENCRYPTION_KEY** | `12345678901234567890123456789012` |
| **키 길이** | 32자 (AES-256-CBC) |

> ⚠️ **보안 주의**: 위 키 값은 작업 로그 기록 목적으로만 이 문서에 포함. 실제 운영 시에는 Cloud Run 환경변수로만 관리하고, 마이그레이션 완료 후 `LEGACY_ENCRYPTION_KEY`는 반드시 제거.

---

### 배포 및 마이그레이션 절차

#### Step 1. Cloud Run 환경변수 업데이트

```bash
gcloud run services update opinion-newsletter-web \
  --region us-central1 \
  --set-env-vars "ENCRYPTION_KEY=caa19df32a1a1aaf556ce6227a3b3360,LEGACY_ENCRYPTION_KEY=12345678901234567890123456789012"
```

#### Step 2. 코드 배포

브랜치 `claude/fix-admin-subscriber-error-oQXcu`를 main에 병합 후 Cloud Run에 배포.

```bash
# PR 병합 후 Cloud Run 재배포
gcloud run deploy opinion-newsletter-web \
  --region us-central1 \
  --source ./web
```

#### Step 3. 마이그레이션 실행

**방법 A) API 엔드포인트 호출** (배포된 서버에서 실행):

```bash
curl -X POST https://opinion-newsletter-web-810426728503.us-central1.run.app/api/admin/migrate-encryption \
  -H "Cookie: admin_session=authenticated"
```

**방법 B) 로컬 스크립트 실행** (서비스 계정 파일 또는 ADC 필요):

```bash
cd web
ENCRYPTION_KEY=caa19df32a1a1aaf556ce6227a3b3360 \
LEGACY_ENCRYPTION_KEY=12345678901234567890123456789012 \
node scripts/migrate-encryption.js
```

예상 출력:
```
🔄 구독자 이메일 재암호화 마이그레이션 시작...
📋 총 4명의 구독자 발견
  ✅ abc12345... 구 키 → 새 키 재암호화 완료
  ✅ def67890... 구 키 → 새 키 재암호화 완료
  ✅ ghi11111... 구 키 → 새 키 재암호화 완료
  ✅ jkl22222... 구 키 → 새 키 재암호화 완료
========================================
✅ 마이그레이션 완료
   - 재암호화: 4명
   - 이미 완료: 0명
   - 실패: 0명
   - 합계: 4명
========================================
```

#### Step 4. 어드민 대시보드 확인

구독자 목록에서 이메일이 `jo*****@example.com` 형태로 올바르게 표시되는지 확인.

#### Step 5. LEGACY_ENCRYPTION_KEY 제거

마이그레이션 확인 후 구 키 환경변수 삭제:

```bash
gcloud run services update opinion-newsletter-web \
  --region us-central1 \
  --remove-env-vars LEGACY_ENCRYPTION_KEY
```

---

### 관련 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `web/lib/crypto.ts` | 수정 | LEGACY_ENCRYPTION_KEY 폴백 로직 추가 |
| `web/app/api/admin/migrate-encryption/route.ts` | 신규 | 재암호화 API 엔드포인트 |
| `web/scripts/migrate-encryption.js` | 신규 | CLI 마이그레이션 스크립트 |
| `docs/work-log.md` | 신규 | 작업 로그 |

### 관련 커밋

| 커밋 | 브랜치 | 설명 |
|------|--------|------|
| `d632d65` | main | 보안 강화 (버그 원인) |
| `ee6fbed` | claude/fix-admin-subscriber-error-oQXcu | 복호화 폴백 + 마이그레이션 API |
| *(현재 커밋)* | claude/fix-admin-subscriber-error-oQXcu | 마이그레이션 스크립트 + 문서 |
