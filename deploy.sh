#!/bin/bash
set -e

# ============================================
# 오뉴 뉴스레터 - Cloud Run 배포 스크립트
# ============================================
#
# 사전 준비:
#   1. gcloud CLI 설치 및 로그인: gcloud auth login
#   2. .env.deploy 파일에 비밀값 설정 (최초 1회)
#
# 실행: ./deploy.sh
# ============================================

# ======== 고정값 (절대 수정 금지) ========
PROJECT_ID="opnionnewsletter"
REGION="asia-northeast3"
SERVICE_NAME="opinionnewsletter-web"
# =========================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

# .env.deploy 파일 확인
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "========================================="
    echo "  최초 설정이 필요합니다"
    echo "========================================="
    echo ""
    echo ".env.deploy 파일이 없습니다. 자동으로 생성합니다."
    echo "각 항목을 입력해주세요."
    echo ""

    read -rp "Gmail 주소: " input_gmail_user
    read -rp "Gmail 앱 비밀번호 (https://myaccount.google.com/apppasswords): " input_gmail_pass
    read -rp "관리자 비밀번호 (원하는 값): " input_admin_pass

    # 자동 생성 가능한 키는 자동으로 생성
    input_encryption_key=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))" 2>/dev/null || openssl rand -hex 16)
    input_cron_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || openssl rand -hex 32)

    cat > "$ENV_FILE" << ENVEOF
# 오뉴 뉴스레터 배포 비밀값 (이 파일은 git에 포함되지 않습니다)
GMAIL_USER="$input_gmail_user"
GMAIL_APP_PASSWORD="$input_gmail_pass"
ENCRYPTION_KEY="$input_encryption_key"
ADMIN_PASSWORD="$input_admin_pass"
CRON_SECRET="$input_cron_secret"
ENVEOF

    echo ""
    echo ".env.deploy 파일이 생성되었습니다."
    echo "ENCRYPTION_KEY와 CRON_SECRET은 자동 생성되었습니다."
    echo ""
fi

# .env.deploy 로드
source "$ENV_FILE"

# 필수값 확인
missing=false
if [ -z "$GMAIL_USER" ]; then echo "GMAIL_USER가 비어있습니다."; missing=true; fi
if [ -z "$GMAIL_APP_PASSWORD" ]; then echo "GMAIL_APP_PASSWORD가 비어있습니다."; missing=true; fi
if [ -z "$ENCRYPTION_KEY" ]; then echo "ENCRYPTION_KEY가 비어있습니다."; missing=true; fi
if [ -z "$ADMIN_PASSWORD" ]; then echo "ADMIN_PASSWORD가 비어있습니다."; missing=true; fi
if [ -z "$CRON_SECRET" ]; then echo "CRON_SECRET이 비어있습니다."; missing=true; fi

if [ "$missing" = true ]; then
    echo ""
    echo ".env.deploy 파일을 확인해주세요: $ENV_FILE"
    exit 1
fi

echo ""
echo "========================================="
echo "  오뉴 뉴스레터 배포 시작"
echo "========================================="
echo ""
echo "  프로젝트: $PROJECT_ID"
echo "  리전:     $REGION"
echo "  서비스:   $SERVICE_NAME"
echo "  Gmail:    $GMAIL_USER"
echo ""

# 프로젝트 설정
gcloud config set project "$PROJECT_ID"

# Docker 이미지 빌드 및 푸시
echo "🔨 Docker 이미지 빌드 중..."
cd "$SCRIPT_DIR/web"
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME" .
cd "$SCRIPT_DIR"

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
