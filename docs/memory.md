## 2026-03-12 세션 메모리

### 프로젝트 기본 정보
- **프로젝트**: 오뉴(오뉴) 뉴스레터 — 한국어 의견 뉴스레터 서비스
- **스택**: Next.js 16.1.6 (App Router), React 19, TypeScript, Firebase Firestore, Tailwind CSS 4, Cloud Run
- **GCP 프로젝트 ID**: `opnionnewsletter` (오타 주의: opinion → opnion)
- **Firebase DB**: `opinionnewsletterdb` (named database)

### Cloud Run 서비스 정보
- **현재 서비스명**: `opinionnewsletter-web`
- **리전**: `asia-northeast3` (서울)
- **어드민 URL**: `https://opinionnewsletter-web-810426728503.asia-northeast3.run.app/admin`
- **구 URL (사용 안 함)**: `https://opinion-newsletter-web-810426728503.us-central1.run.app` — 서비스 이전으로 무효

### 암호화 키 현황
- **현재 ENCRYPTION_KEY**: `caa19df32a1a1aaf556ce6227a3b3360`
- **구 LEGACY_ENCRYPTION_KEY**: `12345678901234567890123456789012` — 마이그레이션 후 제거 권장
- 암호화: AES-256-CBC, IV 포함, `:` 구분자로 저장

### 어드민 인증
- 방식: 단일 비밀번호 (`ADMIN_PASSWORD` 환경변수)
- 쿠키: `admin_session=authenticated`, httpOnly, Secure, SameSite=Strict, 24시간
- 로그아웃: `/api/admin/logout` POST (서버 측 쿠키 삭제) — 이번 세션에서 수정됨

### 이번 세션 수정 이력 (브랜치: claude/fix-admin-dashboard-rVL2d)
1. `web/app/api/admin/logout/route.ts` 신규 — httpOnly 쿠키 서버 측 삭제
2. `web/app/admin/dashboard/page.tsx` — handleLogout 수정, colSpan 7, NaN% 수정
3. `web/app/admin/page.tsx` — 인증 세션 감지 후 대시보드 자동 리다이렉트
4. `.github/workflows/deploy.yml` — main push 시 Cloud Run 자동 배포

### GitHub Actions 배포 (미완료 — 사용자가 Secrets 설정 필요)
필요한 Secrets: GCP_SERVICE_ACCOUNT_KEY, GMAIL_USER, GMAIL_APP_PASSWORD, ENCRYPTION_KEY, ADMIN_PASSWORD, CRON_SECRET

### 주의사항
- trackingUrl이 코드에 하드코딩 되어 있음 (`admin/send/route.ts`, `cron/send/route.ts`) — 추후 환경변수화 권장
- 현재 PR(claude/fix-admin-dashboard-rVL2d)은 아직 main에 머지되지 않음 — 머지 후 배포 필요
