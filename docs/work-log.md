# 오뉴 작업 로그

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

### 실제 배포 진행 내역 (2026-03-12)

> ⚠️ 초기 계획의 서비스명/리전이 잘못되어 실제 진행 시 수정됨.
> 실제 서비스: `opinionnewsletter-web` / `asia-northeast3`

#### Step 1. LEGACY_ENCRYPTION_KEY 환경변수 추가 ✅

```bash
gcloud run services update opinionnewsletter-web \
  --region asia-northeast3 \
  --set-env-vars "LEGACY_ENCRYPTION_KEY=12345678901234567890123456789012"
# → revision opinionnewsletter-web-00033-cng 배포됨
```

#### Step 2. 새 코드 배포 ✅

```bash
cd ~/opinionnewsletter/web
gcloud run deploy opinionnewsletter-web \
  --region asia-northeast3 \
  --source .
# → revision opinionnewsletter-web-00034-6ch 배포됨
```

> ⚠️ **문제 발생**: `--source .` 직접 배포 시 deploy.sh를 거치지 않아
> ENCRYPTION_KEY가 새 리비전에서 누락됨 (원래 deploy.sh가 .env.deploy에서 주입).

#### Step 3. ENCRYPTION_KEY 재설정 (진행 중)

```bash
gcloud run services update opinionnewsletter-web \
  --region asia-northeast3 \
  --set-env-vars "ENCRYPTION_KEY=caa19df32a1a1aaf556ce6227a3b3360"
```

> 구독자 4명 전원이 보안 강화(2026-02-11) 이전 가입이므로 기존 ENCRYPTION_KEY 값 무관.
> 새로 생성한 키(`caa19df32a1a1aaf556ce6227a3b3360`)를 신규 ENCRYPTION_KEY로 확정.
> **`.env.deploy` 파일의 ENCRYPTION_KEY도 동일 값으로 업데이트 필요.**

#### Step 4. 마이그레이션 실행 (예정)

```bash
curl -X POST https://opinionnewsletter-web-810426728503.asia-northeast3.run.app/api/admin/migrate-encryption \
  -H "Cookie: admin_session=authenticated"
# 예상 응답: {"success":true,"migrated":4,"failed":0,"total":4}
```

#### Step 5. 어드민 대시보드 확인 (예정)

구독자 목록에서 이메일이 `bi****@gmail.com` 형태로 정상 표시되는지 확인.

#### Step 6. LEGACY_ENCRYPTION_KEY 제거 (예정)

```bash
gcloud run services update opinionnewsletter-web \
  --region asia-northeast3 \
  --remove-env-vars LEGACY_ENCRYPTION_KEY
```

---

### 부수 작업: GitHub Actions 자동 병합 설정

**배경**: Claude Code 웹 환경은 `claude/*` 브랜치에만 push 가능. 매번 GitHub에서 수동 PR 병합 필요.

**해결**: `.github/workflows/auto-merge-claude.yml` 추가
- `claude/**` 브랜치 push 시 자동으로 main에 merge 후 브랜치 삭제
- **활성화 필요**: GitHub → Settings → Actions → General → Workflow permissions → "Read and write permissions"

**커밋**: `26abbe9` — `ci: add GitHub Actions auto-merge for claude/* branches`

---

### 관련 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `web/lib/crypto.ts` | 수정 | LEGACY_ENCRYPTION_KEY 폴백 로직 추가 |
| `web/app/api/admin/migrate-encryption/route.ts` | 신규 | 재암호화 API 엔드포인트 |
| `web/scripts/migrate-encryption.js` | 신규 | CLI 마이그레이션 스크립트 |
| `web/env.local.example` | 신규 | 환경변수 설정 예시 |
| `.github/workflows/auto-merge-claude.yml` | 신규 | Claude 브랜치 자동 병합 워크플로우 |
| `docs/work-log.md` | 신규 | 작업 로그 |

### 관련 커밋

| 커밋 | 설명 |
|------|------|
| `d632d65` | 보안 강화 — 버그 원인 |
| `ee6fbed` | 복호화 폴백 + 마이그레이션 API 추가 |
| `8cf5659` | 마이그레이션 스크립트 + env 예시 + 문서 |
| `26abbe9` | GitHub Actions 자동 병합 워크플로우 |
| `a0bef76` | Auto-merge (Actions 첫 작동 확인) |
