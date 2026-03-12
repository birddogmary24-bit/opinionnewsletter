# 개발 세션 로그 - 2026년 3월 12일

## 세션 개요

뉴스레터 구독/이메일 전송 버그 수정, 자동 발송 시스템 구축, 배포 스크립트 개선, Cloud Run 재배포 완료. GitHub Actions CI/CD 파이프라인 구축 및 실수 방지용 커스텀 스킬 추가.

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

### 6. GitHub Actions CI/CD 파이프라인 구축 (`6502d03`)

**신규 파일:**
- `.github/workflows/deploy.yml` - 자동 배포 워크플로우
- `.github/workflows/pr-check.yml` - PR 검증 워크플로우

**변경 내용:**
- `deploy.yml`: main push 시 자동 빌드 → Cloud Run 배포 → 헬스체크 → 실패 시 롤백
- `pr-check.yml`: PR 시 lint/타입체크/빌드 검증으로 깨진 코드 머지 방지
- 고정값(서비스명/리전/프로젝트ID)을 workflow 파일에 하드코딩하여 실수 방지
- GCP 인증은 Service Account Key 방식 (GitHub Secrets `GCP_SA_KEY`)

**배포 흐름 변경:**
- 기존: 클라우드 코드 수정 → Mac에서 git pull → Mac에서 ./deploy.sh
- 변경: 클라우드 코드 수정 → main push → GitHub Actions 자동 배포

### 7. 커스텀 스킬 파일 추가 (`6502d03`)

**신규 파일:**
- `.claude/skills/deploy-check/SKILL.md` - `/deploy-check` 명령어
- `.claude/skills/deploy-status/SKILL.md` - `/deploy-status` 명령어
- `.claude/skills/session-log/SKILL.md` - `/session-log` 명령어

**목적:**
- `/deploy-check`: 배포 설정값(서비스명/리전/프로젝트ID)이 모든 파일에서 일치하는지 자동 검증. 오늘 반복된 잘못된 서비스명/리전 실수 방지
- `/deploy-status`: 현재 Cloud Run 서비스 상태와 헬스체크 결과 확인 가이드
- `/session-log`: 커밋 히스토리 기반 세션 로그 자동 생성

### 8. CLAUDE.md 업데이트 (`6502d03`)

- 자동 배포(GitHub Actions) 섹션 추가
- 수동 배포를 폴백 옵션으로 변경
- Custom Skills 섹션 추가

## 향후 작업 (TODO)

- [x] GitHub Actions 자동 배포 파이프라인 구축 → 완료 (활성화하려면 GCP 서비스 계정 + GitHub Secrets 설정 필요)
- [ ] GCP 서비스 계정 생성 및 GitHub Secrets 등록 (1회 수동 설정)
- [ ] 커스텀 도메인 연결 (URL 변경 방지)
- [ ] 이전 URL (`810426728503`) 접속 가능 여부 확인

## 변경 파일 요약 (18개 파일, +901줄 / -28줄)

```
.claude/skills/deploy-check/SKILL.md   |  46 +++
.claude/skills/deploy-status/SKILL.md  |  43 +++
.claude/skills/session-log/SKILL.md    |  50 +++
.github/workflows/deploy.yml           | 113 +++
.github/workflows/pr-check.yml         |  30 +++
CLAUDE.md                              |  63 +++
deploy.sh                              | 145 +++
docs/2026-03-12-session-log.md         | 102 +++
web/.env.example                       |  39 +++
web/Dockerfile                         |   1 +
web/app/api/admin/send/route.ts        |   4 +-
web/app/api/cron/send/route.ts         | 231 +++
web/app/api/health/route.ts            |  79 +++
web/app/api/subscribe/route.ts         |  19 +-
web/app/page.tsx                       |  26 +-
web/package-lock.json                  |  19 +-
web/scripts/trigger-test-send.ts       |   2 +-
web/templates/email_daily.html         |   2 +-
```
