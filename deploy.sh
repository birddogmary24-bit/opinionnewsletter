#!/bin/bash
set -e

# ============================================
# 오뉴 뉴스레터 - Cloud Run 배포 스크립트
# ============================================
#
# 사전 준비:
#   1. gcloud CLI 설치: https://cloud.google.com/sdk/docs/install
#   2. 로그인: gcloud auth login
#   3. 이 파일의 환경변수 값 채우기 (아래 EDIT HERE 섹션)
#
# 실행 방법:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# ============================================

# ======== EDIT HERE: 환경변수 설정 ========
PROJECT_ID="opnionnewsletter"
REGION="us-central1"
SERVICE_NAME="opinion-newsletter-web"

# Gmail 설정 (필수)
# Gmail 앱 비밀번호 생성: https://myaccount.google.com/apppasswords
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# 암호화 키 (필수, 정확히 32자)
# 생성: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
ENCRYPTION_KEY="00000000000000000000000000000000"

# 관리자 비밀번호 (필수)
ADMIN_PASSWORD="your-admin-password"

# 크론 시크릿 (필수, 자동 발송용)
# 생성: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET="your-cron-secret"

# ======== 여기까지 수정 ========

echo ""
echo "========================================="
echo "  오뉴 뉴스레터 배포 시작"
echo "========================================="
echo ""

# 값 확인
if [ "$GMAIL_USER" = "your-email@gmail.com" ]; then
    echo "❌ 오류: GMAIL_USER를 실제 Gmail 주소로 변경해주세요."
    echo "   deploy.sh 파일을 열어 'EDIT HERE' 섹션의 값을 채워주세요."
    exit 1
fi

if [ "$ENCRYPTION_KEY" = "00000000000000000000000000000000" ]; then
    echo "❌ 오류: ENCRYPTION_KEY를 실제 값으로 변경해주세요."
    echo "   생성 명령어: node -e \"console.log(require('crypto').randomBytes(16).toString('hex'))\""
    exit 1
fi

if [ "$CRON_SECRET" = "your-cron-secret" ]; then
    echo "❌ 오류: CRON_SECRET을 실제 값으로 변경해주세요."
    echo "   생성 명령어: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    exit 1
fi

# 프로젝트 설정
echo "📌 프로젝트 설정: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Docker 이미지 빌드 및 푸시
echo ""
echo "🔨 Docker 이미지 빌드 중..."
cd web
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME" .
cd ..

# Cloud Run 배포
echo ""
echo "🚀 Cloud Run 배포 중..."
gcloud run deploy "$SERVICE_NAME" \
    --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "\
GMAIL_USER=$GMAIL_USER,\
GMAIL_APP_PASSWORD=$GMAIL_APP_PASSWORD,\
ENCRYPTION_KEY=$ENCRYPTION_KEY,\
ADMIN_PASSWORD=$ADMIN_PASSWORD,\
CRON_SECRET=$CRON_SECRET,\
NODE_ENV=production"

# 서비스 URL 가져오기
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")
echo ""
echo "✅ 배포 완료! URL: $SERVICE_URL"

# Cloud Scheduler 설정 (매일 아침 7시 KST)
echo ""
echo "⏰ Cloud Scheduler 설정 중 (매일 07:00 KST)..."

# 기존 Job이 있으면 삭제
gcloud scheduler jobs delete "newsletter-daily-send" --location="$REGION" --quiet 2>/dev/null || true

# 새 Job 생성
gcloud scheduler jobs create http "newsletter-daily-send" \
    --location="$REGION" \
    --schedule="0 7 * * *" \
    --time-zone="Asia/Seoul" \
    --uri="${SERVICE_URL}/api/cron/send" \
    --http-method=POST \
    --headers="x-cron-secret=$CRON_SECRET,Content-Type=application/json" \
    --attempt-deadline="300s" \
    --description="오뉴 뉴스레터 매일 아침 7시 자동 발송"

echo ""
echo "========================================="
echo "  배포 완료!"
echo "========================================="
echo ""
echo "📧 웹사이트: $SERVICE_URL"
echo "🔍 헬스체크: $SERVICE_URL/api/health"
echo "👤 관리자:   $SERVICE_URL/admin"
echo "⏰ 자동발송: 매일 아침 7:00 AM (KST)"
echo ""
echo "💡 헬스체크 페이지에서 모든 설정이 'ok'인지 확인해주세요!"
echo ""
