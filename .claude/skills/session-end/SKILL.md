---
name: session-end
description: 세션 종료 전 로그 기록 및 memory 업데이트. 사용자가 "종료", "끝", "마무리", "세션 끝" 등을 말하면 이 스킬을 실행하세요.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# 세션 종료 절차

사용자가 세션 종료를 요청하면 아래 절차를 순서대로 수행하세요.

## 1. 미커밋/미push 확인

```bash
git status
git log --oneline @{u}..HEAD 2>/dev/null
```

- 미커밋 변경사항이 있으면 커밋 여부를 사용자에게 확인
- 미push 커밋이 있으면 push 여부를 사용자에게 확인

## 2. 세션 로그 생성/업데이트

- 오늘 날짜의 커밋 히스토리 기반으로 `docs/YYYY-MM-DD-session-log.md` 생성
- 이미 존재하면 새 작업 내역을 추가
- `/session-log` 스킬의 포맷을 따르기

## 3. memory.md 업데이트

`memory.md` 파일을 읽고:
- 이번 세션에서 발견된 새로운 이슈/교훈이 있으면 추가
- 완료된 미완료 작업이 있으면 체크 표시
- 새로운 미완료 작업이 있으면 추가

## 4. 최종 커밋 & push

세션 로그와 memory.md 변경사항을 커밋하고 push:
```bash
git add docs/ memory.md
git commit -m "docs: 세션 로그 및 memory 업데이트"
git push
```

## 5. 종료 메시지

사용자에게 요약 보고:
- 오늘 총 커밋 수
- 주요 작업 내역 (1-2줄)
- 미완료 작업 목록
- "수고하셨습니다!" 인사
