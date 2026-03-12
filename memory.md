# Project Memory

## 프로젝트 핵심 정보

- **프로젝트명**: 오뉴(Opinion Newsletter) - AI 뉴스레터 서비스
- **소유자**: birddogmary24@gmail.com
- **GitHub**: birddogmary24-bit/opinionnewsletter

## 배포 설정 (절대 변경 금지)

| 항목 | 값 |
|------|-----|
| GCP Project ID | `opnionnewsletter` |
| Service Name | `opinionnewsletter-web` (하이픈 없음!) |
| Region | `asia-northeast3` (서울) |
| 현재 URL | `https://opinionnewsletter-web-2esrubv4sa-du.a.run.app` |
| 이전 URL | `https://opinionnewsletter-web-810426728503.asia-northeast3.run.app` |

## 기술 스택

- Frontend/API: Next.js 16 (TypeScript, Tailwind CSS)
- Database: Firebase Firestore
- Email: Gmail + Nodemailer
- Hosting: Google Cloud Run
- CI/CD: GitHub Actions (설정 완료, GCP 서비스 계정 등록 필요)

## 과거 이슈 & 교훈

### 2026-03-12: 잘못된 서비스명/리전 반복 배포
- **원인**: deploy.sh에 `opinion-newsletter-web` (하이픈 있음) + `us-central1` 하드코딩
- **교훈**: 서비스명은 `opinionnewsletter-web`, 리전은 `asia-northeast3` 고정. 배포 전 `/deploy-check` 실행 권장
- **대책**: CLAUDE.md에 고정값 명시, GitHub Actions workflow에 하드코딩, `/deploy-check` 스킬 추가

### 2026-03-12: Mac 로컬 deploy.sh 동기화 문제
- **원인**: 클라우드에서 코드 수정 → Mac에서 git pull 안 하고 배포
- **교훈**: Mac 로컬 배포는 항상 `git pull origin main` 먼저
- **대책**: GitHub Actions 자동 배포로 전환 (Mac 불필요)

## 미완료 작업

- [ ] GCP 서비스 계정 생성 + GitHub Secrets 등록 (GitHub Actions 활성화)
- [ ] 커스텀 도메인 연결 (URL 변경 방지)
- [ ] 이전 URL 접속 가능 여부 확인

## 세션 종료 시 체크리스트

1. 미커밋 변경사항 확인 (`git status`)
2. 미push 커밋 확인 (`git log --oneline @{u}..HEAD`)
3. 세션 로그 작성 (`/session-log`)
4. 이 memory.md에 새로운 교훈/이슈 추가
