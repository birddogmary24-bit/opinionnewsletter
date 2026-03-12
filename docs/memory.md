# 오뉴 뉴스레터 - 핵심 메모리

> 세션 중 자주 참조하는 핵심 정보. 토큰 절약용.
> 상세 작업 기록은 `sessionlog.md` 참조.

---

## 프로젝트 기본 정보

| 항목 | 값 |
|------|-----|
| 서비스명 | 오뉴 뉴스레터 (한국어 의견 뉴스레터) |
| 스택 | Next.js (App Router), React, TypeScript, Firebase Firestore, Tailwind CSS, Cloud Run |
| GCP 프로젝트 ID | `opnionnewsletter` (**오타 주의**: opinion → opnion) |
| Firebase DB | `opinionnewsletterdb` (named database) |

## Cloud Run 서비스

| 항목 | 값 |
|------|-----|
| 서비스명 | `opinionnewsletter-web` (하이픈 없음) |
| 리전 | `asia-northeast3` (서울) |
| 현재 URL | `https://opinionnewsletter-web-810426728503.asia-northeast3.run.app` |
| 어드민 URL | 위 URL + `/admin` |
| 구 URL (무효) | `https://opinion-newsletter-web-810426728503.us-central1.run.app` |

## 어드민 인증

- 방식: 단일 비밀번호 (`ADMIN_PASSWORD` 환경변수)
- 쿠키: `admin_session=authenticated`, httpOnly, Secure, SameSite=Strict, 24시간
- 로그아웃: `/api/admin/logout` POST (서버 측 쿠키 삭제)

## 암호화

| 항목 | 값 |
|------|-----|
| ENCRYPTION_KEY | `caa19df32a1a1aaf556ce6227a3b3360` |
| LEGACY_ENCRYPTION_KEY | `12345678901234567890123456789012` (마이그레이션 후 제거) |
| 방식 | AES-256-CBC, IV 포함, `:` 구분자 |

## GitHub Actions 배포

- **트리거**: `main` 브랜치 push 또는 auto-merge 완료(`workflow_run`)
- **흐름**: lint/타입체크 → Docker 빌드 → Cloud Run 배포 → 헬스체크 → 실패 시 롤백
- **Secrets**: `GCP_SA_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_PASSWORD`, `ENCRYPTION_KEY`, `CRON_SECRET`
- **GCP 서비스 계정**: `github-actions-opinionnewlette` (Artifact Registry 관리자 권한 포함)

## 주요 API 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /api/health` | 헬스체크 (Gmail, Firebase, 암호화키 상태) |
| `POST /api/subscribe` | 이메일 구독 |
| `POST /api/cron/send` | 자동 발송 (CRON_SECRET 보호) |
| `GET/POST /admin` | 어드민 페이지 |
| `POST /api/admin/logout` | 로그아웃 (서버 측 쿠키 삭제) |
| `POST /api/admin/migrate-encryption` | 암호화 키 마이그레이션 |

## 현재 미완료 작업

1. PR `claude/fix-admin-dashboard-rVL2d` → main 머지 및 배포
2. 구독자 이메일 암호화 마이그레이션 실행 → `LEGACY_ENCRYPTION_KEY` 제거
3. `trackingUrl` 하드코딩 환경변수화 필요 (`admin/send/route.ts`, `cron/send/route.ts`)
4. 커스텀 도메인 연결

## 커스텀 스킬

| 스킬 | 설명 |
|------|------|
| `/deploy-check` | 배포 설정값(서비스명/리전/프로젝트ID) 일치 검증 |
| `/deploy-status` | Cloud Run 현재 상태 및 헬스체크 확인 |
| `/session-log` | 세션 로그 생성 |
