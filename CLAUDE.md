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

Run from project root on local Mac:
```bash
./deploy.sh
```

The script handles: Docker build, Cloud Run deploy, Cloud Scheduler setup (daily 7:00 AM KST).

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
