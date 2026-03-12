# 오뉴 뉴스레터 - 세션 작업 로그

> 새 세션 시작 시 이 파일을 먼저 읽고 시작할 것.
> 작업 완료 후 이 파일에 내용을 추가할 것.

---

## 2026-03-12 | 1차 세션 — 초기 셋업, 배포 자동화, CI/CD 구축

### 작업 요약
뉴스레터 구독/이메일 전송 버그 수정, 자동 발송 시스템 구축, 배포 스크립트 개선, Cloud Run 재배포 완료. GitHub Actions CI/CD 파이프라인 구축 및 커스텀 스킬 추가.

### 주요 작업

| # | 커밋 | 내용 |
|---|------|------|
| 1 | `5f73240` | 구독 API 에러 처리 개선, 중복 이메일 방지, 프론트엔드 에러 메시지 UI 추가 |
| 2 | `dd57bef` | `/api/cron/send`, `/api/health`, `deploy.sh`, `.env.example` 신규 추가 |
| 3 | `660e90e` | Cloud Run 서비스명(`opinionnewsletter-web`) / 리전(`asia-northeast3`) 수정 |
| 4 | `b76e3c7` | `deploy.sh` 비밀값 `.env.deploy`로 분리, ENCRYPTION_KEY/CRON_SECRET 자동 생성 |
| 5 | `1caf816` | `CLAUDE.md` 신규 — 배포 설정 고정 문서화 |
| 6 | `6502d03` | GitHub Actions 자동 배포(`deploy.yml`), PR 검증(`pr-check.yml`), 커스텀 스킬 3개 추가, TypeScript lint 에러 전체 수정 |

### 배포 결과

| 항목 | 값 |
|------|-----|
| 서비스명 | `opinionnewsletter-web` |
| 리전 | `asia-northeast3` (서울) |
| 프로젝트 | `opnionnewsletter` |
| 배포 URL | `https://opinionnewsletter-web-810426728503.asia-northeast3.run.app` |
| 헬스체크 | overall: healthy |
| 구독자 수 | 4명 |
| 자동발송 | 매일 07:00 KST (Cloud Scheduler) |
| GitHub Actions | Deploy to Cloud Run #5 → **Success** |

### 이슈 및 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| 잘못된 서비스 생성(`opinion-newsletter-web` in `us-central1`) | deploy.sh 잘못된 값 | 서비스 삭제 후 올바른 값으로 재배포 |
| Mac 로컬 deploy.sh 업데이트 안 됨 | git pull 전 로컬 변경사항 충돌 | `git stash && git pull origin main` |
| GitHub Actions lint 에러 | `@typescript-eslint/no-explicit-any` 다수 | 6개 파일 타입 수정 |
| Docker push 권한 부족 | `artifactregistry.repositories.uploadArtifacts` 없음 | GCP IAM에서 Artifact Registry 관리자 역할 추가 |
| auto-merge 후 deploy 미트리거 | GitHub 보안 정책(GITHUB_TOKEN push) | `deploy.yml`에 `workflow_run` 트리거 추가 |

### GitHub Secrets (등록 완료)
`GCP_SA_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_PASSWORD`, `ENCRYPTION_KEY`, `CRON_SECRET`

---

## 2026-03-12 | 2차 세션 — 어드민 대시보드 버그 수정

### 작업 요약
어드민 접속 불가 문제 원인 파악 및 로그아웃/UI 버그 수정. GitHub Actions 자동 배포 워크플로우 추가.

**브랜치**: `claude/fix-admin-dashboard-rVL2d`

### 원인 분석

**1. 서비스 URL 불일치 (접속 불가 주원인)**

| | 구 URL (접속 불가) | 신 URL (정상) |
|---|---|---|
| 서비스명 | `opinion-newsletter-web` | `opinionnewsletter-web` |
| 리전 | `us-central1` | `asia-northeast3` |

**2. 로그아웃 버튼 미작동 (Critical)**

`httpOnly` 쿠키를 `document.cookie`로 삭제 시도 → 브라우저 차단으로 로그아웃 불가.

```javascript
// Before (동작 안 함)
document.cookie = 'admin_session=; Max-Age=0; ...';

// After (서버 API 통해 삭제)
await fetch('/api/admin/logout', { method: 'POST' });
```

**3. 기타 버그**
- 이미 로그인된 사용자가 `/admin` 재방문 시 로그인 폼 재노출
- 통계 탭 `colSpan={6}` → 실제 7컬럼 테이블
- 분석 탭 `recipient_count === 0`일 때 `NaN%` 표시

### 수정 내용

| 파일 | 변경 | 내용 |
|------|------|------|
| `web/app/api/admin/logout/route.ts` | 신규 | 서버 측 httpOnly 쿠키 삭제 API |
| `web/app/admin/dashboard/page.tsx` | 수정 | handleLogout 수정, colSpan 7, NaN% 가드 |
| `web/app/admin/page.tsx` | 수정 | 세션 감지 → 대시보드 자동 리다이렉트 |
| `.github/workflows/deploy.yml` | 신규 | main push 시 Cloud Run 자동 배포 |

### 커밋
| 커밋 | 설명 |
|------|------|
| `363d677` | fix: admin 대시보드 주요 버그 수정 (로그아웃·colSpan·NaN%) |
| `3d93222` | ci: GitHub Actions 자동 배포 워크플로우 추가 |

> ⚠️ 이 PR은 main 머지 후 배포 필요.

---

## 2026-03-12 | 3차 세션 — 구독자 이메일 "error" 표시 버그 수정 및 암호화 키 마이그레이션

### 작업 요약
어드민 대시보드 구독자 목록에서 모든 이메일이 `error`로 표시되는 버그 수정. 암호화 키 마이그레이션 도구 추가.

**브랜치**: `claude/fix-admin-subscriber-error-oQXcu`

### 원인 분석

커밋 `d632d65` (2026-02-11, 보안 강화)에서 하드코딩 기본 암호화 키 폴백 제거됨.
기존 구독자 4명은 모두 그 이전에 구 기본 키(`12345678901234567890123456789012`)로 암호화 저장되어 있었음.

**실패 흐름**: `decryptEmail()` → ENCRYPTION_KEY 없음 → 예외 → `null` → `maskEmail('error')` → `error` 반환

### 수정 내용

| 파일 | 변경 | 내용 |
|------|------|------|
| `web/lib/crypto.ts` | 수정 | `LEGACY_ENCRYPTION_KEY` 폴백 지원 추가 |
| `web/app/api/admin/migrate-encryption/route.ts` | 신규 | 재암호화 API 엔드포인트 (어드민 인증 필요) |
| `web/scripts/migrate-encryption.js` | 신규 | CLI 마이그레이션 스크립트 |

### 암호화 키 현황

| 항목 | 값 |
|------|-----|
| **현재 ENCRYPTION_KEY** | `caa19df32a1a1aaf556ce6227a3b3360` |
| **구 LEGACY_ENCRYPTION_KEY** | `12345678901234567890123456789012` |
| **암호화 방식** | AES-256-CBC, IV 포함, `:` 구분자로 저장 |

> ⚠️ 마이그레이션 완료 후 `LEGACY_ENCRYPTION_KEY` 환경변수 반드시 제거.

### 마이그레이션 절차

1. Cloud Run 환경변수에 `LEGACY_ENCRYPTION_KEY` 추가
2. 코드 배포 (브랜치 main 병합)
3. 마이그레이션 실행:
   ```bash
   curl -X POST https://opinionnewsletter-web-810426728503.asia-northeast3.run.app/api/admin/migrate-encryption \
     -H "Cookie: admin_session=authenticated"
   ```
4. 어드민에서 이메일 정상 표시 확인
5. `LEGACY_ENCRYPTION_KEY` 환경변수 제거

### 커밋
| 커밋 | 브랜치 | 설명 |
|------|--------|------|
| `d632d65` | main | 보안 강화 (버그 원인 커밋) |
| `ee6fbed` | claude/fix-admin-subscriber-error-oQXcu | 복호화 폴백 + 마이그레이션 API |

---

## TODO (미완료 항목)

- [ ] 현재 PR(`claude/fix-admin-dashboard-rVL2d`) main 머지 및 배포
- [ ] 구독자 이메일 암호화 마이그레이션 실행 및 `LEGACY_ENCRYPTION_KEY` 제거
- [ ] 커스텀 도메인 연결 (URL 변경 방지)
- [ ] `trackingUrl` 하드코딩 환경변수화 (`admin/send/route.ts`, `cron/send/route.ts`)
