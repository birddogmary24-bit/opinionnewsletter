---
name: deploy-status
description: 현재 배포 상태와 헬스체크 결과 확인
disable-model-invocation: true
allowed-tools: Bash, Read
---

# 배포 상태 확인

현재 Cloud Run 서비스 상태를 확인하는 가이드를 제공합니다.

## 확인 절차

사용자에게 아래 명령어를 Mac 터미널에서 실행하도록 안내하세요:

### 1. 서비스 목록 확인
```bash
gcloud run services list --platform managed
```
- `opinionnewsletter-web` 이 `asia-northeast3`에 있어야 정상
- 다른 이름이나 다른 리전의 서비스가 있으면 잘못 생성된 것이므로 삭제 안내

### 2. 헬스체크
```bash
curl -s https://opinionnewsletter-web-2esrubv4sa-du.a.run.app/api/health | python3 -m json.tool
```

### 3. 헬스체크 결과 해석
- `overall: "healthy"` → 모든 설정 정상
- `overall: "degraded"` → 일부 설정 문제 (warning 항목 확인)
- `overall: "unhealthy"` → 심각한 문제 (error 항목 확인)

### 4. GitHub Actions 배포 로그 확인
```bash
gh run list --workflow=deploy.yml --limit=5
```

## 문제 발생 시

- 잘못된 서비스 삭제: `gcloud run services delete <서비스명> --region <리전> --quiet`
- 수동 배포 폴백: `./deploy.sh`
