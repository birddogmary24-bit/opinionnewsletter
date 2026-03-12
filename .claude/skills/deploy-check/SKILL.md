---
name: deploy-check
description: 배포 설정값(서비스명, 리전, 프로젝트ID)이 올바른지 검증
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# 배포 설정 검증

아래 고정값이 모든 배포 관련 파일에서 일치하는지 검증하세요:

| 항목 | 올바른 값 |
|------|-----------|
| GCP Project ID | `opnionnewsletter` |
| Cloud Run Service Name | `opinionnewsletter-web` |
| Region | `asia-northeast3` |

## 검증 대상 파일

1. `deploy.sh` - PROJECT_ID, SERVICE_NAME, REGION 변수
2. `.github/workflows/deploy.yml` - env 섹션의 PROJECT_ID, SERVICE_NAME, REGION, IMAGE
3. `CLAUDE.md` - Deployment Settings 테이블

## 검증 절차

1. 각 파일에서 해당 값을 Grep으로 검색
2. 올바른 값과 비교
3. 결과를 테이블로 정리

## 출력 형식

```
## 배포 설정 검증 결과

| 파일 | 항목 | 현재값 | 기대값 | 상태 |
|------|------|--------|--------|------|
| deploy.sh | PROJECT_ID | opnionnewsletter | opnionnewsletter | OK |
| ... | ... | ... | ... | ... |

전체 결과: OK / 문제 발견 (N건)
```

하나라도 불일치하면 명확하게 경고하고 수정 방법을 안내하세요.

## 주의사항

- 서비스명에 하이픈 없음: `opinionnewsletter-web` (O), `opinion-newsletter-web` (X)
- 리전은 반드시 서울: `asia-northeast3` (O), `us-central1` (X)
