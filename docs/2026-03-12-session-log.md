# 개발 세션 로그 - 2026년 3월 12일

## 세션 개요

뉴스레터 구독/이메일 전송 버그 수정, 자동 발송 시스템 구축, 배포 스크립트 개선, Cloud Run 재배포 완료.

## 작업 내역

### 1. 뉴스레터 구독 및 이메일 전송 버그 수정 (`5f73240`)

**수정 파일:**
- `web/app/api/subscribe/route.ts` - 구독 API 에러 처리 개선
- `web/app/page.tsx` - 구독 폼 에러 메시지 표시 추가, 중복 이메일 체크

**변경 내용:**
- 구독 시 에러 메시지가 사용자에게 표시되지 않던 문제 수정
- 이미 등록된 이메일 중복 구독 방지 로직 추가
- 프론트엔드에 에러/성공 메시지 UI 추가

### 2. 자동 발송, 헬스체크, 배포 스크립트 추가 (`dd57bef`)

**신규 파일:**
- `web/app/api/cron/send/route.ts` - 자동 뉴스레터 발송 API
- `web/app/api/health/route.ts` - 헬스체크 API
- `deploy.sh` - Cloud Run 배포 자동화 스크립트
- `web/.env.example` - 환경변수 예시 파일

**변경 내용:**
- `/api/cron/send` - Cloud Scheduler에서 호출하는 자동 발송 엔드포인트 (CRON_SECRET으로 보호)
- `/api/health` - Gmail, Firebase, 암호화키 등 모든 설정 상태 확인
- `deploy.sh` - Docker 빌드, Cloud Run 배포, Cloud Scheduler 설정 원클릭 자동화
- Dockerfile에 이메일 템플릿 복사 누락 수정

### 3. Cloud Run 서비스명/리전 수정 (`660e90e`)

**문제:**
- 배포 시 잘못된 서비스명(`opinion-newsletter-web`)과 리전(`us-central1`)이 사용됨
- 올바른 값: `opinionnewsletter-web` / `asia-northeast3`

**수정:**
- `deploy.sh` 내 SERVICE_NAME, REGION 값 수정

### 4. deploy.sh 비밀값 분리 (`b76e3c7`)

**변경 내용:**
- 비밀번호 등 민감 정보를 `.env.deploy` 파일로 분리
- `.env.deploy`는 `.gitignore`에 포함되어 git에 올라가지 않음
- 최초 실행 시 대화형으로 비밀값 입력받아 `.env.deploy` 자동 생성
- ENCRYPTION_KEY, CRON_SECRET은 자동 생성

### 5. CLAUDE.md 프로젝트 설정 고정 (`1caf816`)

**신규 파일:**
- `CLAUDE.md` - 프로젝트 배포 설정 문서

**목적:**
- 서비스명, 리전, 프로젝트 ID 등 배포 설정을 문서화하여 잘못된 값 사용 방지
- AI 어시스턴트가 참조하는 프로젝트 설정 고정

## 배포 결과

| 항목 | 값 |
|------|-----|
| 서비스명 | `opinionnewsletter-web` |
| 리전 | `asia-northeast3` (서울) |
| 프로젝트 | `opnionnewsletter` |
| 배포 URL | `https://opinionnewsletter-web-2esrubv4sa-du.a.run.app` |
| 이전 URL | `https://opinionnewsletter-web-810426728503.asia-northeast3.run.app` |
| 헬스체크 | 모든 항목 정상 (overall: healthy) |
| 구독자 수 | 4명 |
| 자동발송 | 매일 07:00 KST (Cloud Scheduler) |

## 이슈 및 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| 잘못된 서비스 생성 (`opinion-newsletter-web` in `us-central1`) | deploy.sh에 잘못된 값 하드코딩 | 서비스 삭제 후 올바른 값으로 재배포 |
| Mac 로컬 deploy.sh가 업데이트 안 됨 | `git pull` 전 로컬 변경사항 충돌 | `git stash && git pull origin main`으로 해결 |
| 배포 URL 형식 변경 | Google Cloud Run URL 포맷 업데이트 | 정상 동작 확인, 이전 URL도 병행 사용 가능 여부 확인 필요 |

## 향후 작업 (TODO)

- [ ] GitHub Actions 자동 배포 파이프라인 구축 (Mac 로컬 배포 제거)
- [ ] 커스텀 도메인 연결 (URL 변경 방지)
- [ ] 이전 URL (`810426728503`) 접속 가능 여부 확인

## 변경 파일 요약 (12개 파일, +594줄 / -26줄)

```
CLAUDE.md                        |  53 +++
deploy.sh                        | 145 +++
web/.env.example                 |  39 +++
web/Dockerfile                   |   1 +
web/app/api/admin/send/route.ts  |   4 +-
web/app/api/cron/send/route.ts   | 231 +++
web/app/api/health/route.ts      |  79 +++
web/app/api/subscribe/route.ts   |  19 +-
web/app/page.tsx                 |  26 +-
web/package-lock.json            |  19 +-
web/scripts/trigger-test-send.ts |   2 +-
web/templates/email_daily.html   |   2 +-
```
