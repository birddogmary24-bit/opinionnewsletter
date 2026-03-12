# Opinion Newsletter - Project Configuration

## Deployment Settings (DO NOT CHANGE)

These values are fixed. Always use exactly these when deploying or referencing the service:

| Key | Value |
|-----|-------|
| GCP Project ID | `opnionnewsletter` |
| Cloud Run Service Name | `opinionnewsletter-web` |
| Region | `asia-northeast3` (Seoul) |
| Production URL | `https://opinionnewsletter-web-810426728503.asia-northeast3.run.app` |

### Common Mistakes to Avoid

- DO NOT create a new service with a different name (e.g. `opinion-newsletter-web` with a hyphen)
- DO NOT deploy to a different region (e.g. `us-central1`)
- DO NOT change the project ID
- The service name has NO hyphen between "opinion" and "newsletter": `opinionnewsletter-web`

## Project Structure

```
opinionnewsletter/
  web/           # Next.js frontend + API routes (deployed to Cloud Run)
  backend/       # Python backend (not currently deployed)
  deploy.sh      # Deployment script (uses settings above)
```

## Deployment

### 자동 배포 (GitHub Actions) - 권장
`main` 브랜치에 `web/` 디렉토리 변경사항이 push되면 자동 배포됩니다.
- Lint/타입체크 → Docker 빌드 → Cloud Run 배포 → 헬스체크 → 실패 시 롤백
- GitHub Secrets에 비밀값 설정 필요 (GCP_SA_KEY, GMAIL_USER 등)

### 수동 배포 (폴백)
```bash
./deploy.sh
```
Mac에서 실행. Docker build, Cloud Run deploy, Cloud Scheduler 설정 포함.

## Custom Skills

- `/deploy-check` - 배포 설정값(서비스명/리전/프로젝트ID) 검증
- `/deploy-status` - 현재 배포 상태 및 헬스체크 확인
- `/session-log` - 오늘 작업 내역을 docs/에 세션 로그로 생성

## Key API Endpoints

- `/api/health` - Health check
- `/api/subscribe` - Email subscription
- `/api/cron/send` - Automated newsletter send (protected by CRON_SECRET)
- `/admin` - Admin dashboard (protected by ADMIN_PASSWORD)

## Environment Variables (set via deploy.sh / .env.deploy)

- `GMAIL_USER` - Gmail address for sending
- `GMAIL_APP_PASSWORD` - Gmail app password
- `ENCRYPTION_KEY` - For email encryption
- `ADMIN_PASSWORD` - Admin page access
- `CRON_SECRET` - Cron endpoint protection
- `NODE_ENV` - Always `production` in deploy
