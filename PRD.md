# 제품 요구사항 정의서 (PRD): 오뉴 (ONEW)

## 1. 프로젝트 개요 (Project Overview)
**프로젝트 명:** 오뉴 (ONEW) - Opinion Newsletter
**설명:** 경제, 정치, 사회, 교육, 문화, IT/테크 분야의 오피니언 리더들이 발신하는 고품질 콘텐츠(YouTube, 블로그, 기사)를 큐레이션하여 제공하는 프리미엄 데일리 뉴스레터 서비스.
**목표:** 바쁜 전문가들에게 신뢰할 수 있는 전문가들의 인사이트를 요약하여 매일 아침 07:30 AM (KST)에 배달함.

## 2. 타겟 오디언스 (Target Audience)
- **사용자층:** 시사 및 경제 트렌드에 관심이 많은 30-70대 전문직 및 직장인.
- **톤앤매너:** 프리미엄(Premium), 신뢰감(Institutional), 공신력 있는 분위기. "The Economist" 또는 "New York Times" 스타일의 미학적 지향.

## 3. 제품 기능 (Product Features)

### 3.1. 브랜딩 및 디자인 (Branding & Design - 구현 완료)
- **브랜드명:** 오뉴 (ONEW) - "Opinion Newsletter"의 약자.
- **로고 및 이름:** 히어로 섹션 상단에 그라데이션이 적용된 '오뉴' 텍스트 브랜드 타이틀 추가.
- **테마:** 프리미엄 다크 모드 (Slate-950) 및 유동적인 그라데이션 (Blue/Purple/Pink) 적용.
- **타이포그래피:** 깨끗하고 전문적인 느낌을 위해 Pretendard (한글) 및 Inter/System 폰트 사용.
- **반응형 디자인:** 이동 중에도 읽기 편하도록 모바일 우선(Mobile-first) 디자인 적용.

### 3.2. 구독 웹 앱 (Subscription Web App - 구현 완료)
- **랜딩 페이지 (Landing Page):** 
  - 전달력이 높은 가치 제안(Value Proposition)이 포함된 히어로 섹션.
  - 콘텐츠 미리보기: 상위 30개 이상의 아이템을 보여주는 "오늘의 뉴스레터 미리보기" 섹션.
  - 정렬 및 필터링: 오피니언 리더별 카테고리 뷰.

### 3.3. 콘텐츠 수집기 및 크롤러 (Aggregator & Crawler - 구현 완료)
- **자동 수집:** 매일 아침 06:30 AM (KST)에 크롤러 실행.
- **데이터 추출:** 정제된 한글 제목, 썸네일(Thumbnail), 발행처 이름, 원문 URL, 수집 날짜.
- **데이터베이스:** 실시간 동기화를 위한 GCP Firestore 사용.

### 3.4. 관리자 대시보드 (Administrative Dashboard - 구현 완료)
- **URL:** /admin (인증된 관리자 전용)
- **분석 시스템 (Analytics):**
  - **이메일 조회(PV):** 전체 이메일 로드 횟수 측정.
  - **순수 오픈(UV):** 중복을 제외한 실제 독자 수 측정 (IP/UA 및 Subscriber ID 기반).
  - **오픈율(Open Rate):** 발송 대비 UV 비율 산정.
  - **클릭 통계:** 뉴스레터 내 링크 클릭 수 및 클릭률 측정.
- **가독성 개선:** 통계 테이블의 폰트 크기 확대 및 주요 지표 색상 명도 개선 (글자 대비 강화).

### 3.5. 콘텐츠 큐레이션 규칙 (Curation Rules - 구현 완료)
- **최신성 필터링**: 24시간 이내 데이터 우선 선별.
- **수량 제한**: 최우수 콘텐츠 최대 30개 한정.
- **Top 3 Highlights**: 조회수(view_count) 기반 상위 3개 자동 선정.

## 4. 기술 아키텍처 (Technical Architecture)
**클라우드 인프라:** Google Cloud Platform (GCP)
- **Frontend/API:** Cloud Run (us-central1 리전 고정 배포로 URL 일관성 유지).
- **Database:** Google Cloud Firestore (NoSQL).
- **Email Service:** Nodemailer 및 Gmail SMTP 통합.
- **Tracking:** 1x1 투명 픽셀 및 SID(Subscriber ID) 매핑 기반 추적 기술.

## 5. 배포 상태 (Deployment Status)
- **상태:** Production Ready / 배포 완료
- **서비스 URL:** https://opinion-newsletter-web-810426728503.us-central1.run.app/
- **Git Repo:** GitHub 연동 및 최신 기능(PV/UV 추적, UI 디자인 개선) 반영 완료.

## 6. 상세 스펙 (Detailed Specifications)

### 6.1. 이메일 트래킹 고도화 (PV/UV 추적)
- **문제 해결:** 기존 IP 기반 추적 시 Gmail 이미지 프록시로 인한 중복 카운트 문제 해결.
- **기술 스펙:** 
  - 발송 시 각 수신자별로 고유한 **SID (Subscriber ID)**를 메일에 포함.
  - 이미지를 불러올 때 SID를 함께 서버로 전달하여, 동일 사용자가 여러 번 열거나 다른 기기에서 열어도 1회의 UV로만 집계.
  - 전체 조회 수(PV) 데이터는 별도로 누적하여 이메일의 전반적인 노출 강도 측정.

### 6.2. 대시보드 UI/UX 사양
- **헤더 구성:** 뉴스레터 성과(발송/PV/UV/클릭)와 웹사이트 성과(홈 PV/클릭)를 시각적으로 분리하여 구성.
- **디자인 가이드:** 
  - 테이블 헤더 및 데이터 폰트 크기 증량 (기존 대비 ~2px 확대).
  - 텍스트 색상 Brightening (Slate-500 -> Slate-100/300)으로 다크 모드 시인성 확보.
  - 퍼센티지(%) 지표 및 클릭 지표에 고채도 컬러(Blue-300, Green-300) 적용.

### 6.3. URL 안정성 정책
- **일관성 유지:** `us-central1` 리전 서비스를 메인 주소로 고정하여 뉴스레터 내 공유 링크 및 추적 URL의 깨짐 방지.
- **하드코딩 방지:** 모든 템플릿의 `tracking_url` 변수를 중앙 관리하여 환경 변화에 대응.

## 7. 향후 로드맵 (Future Roadmap)
1. **맞춤형 추천:** 사용자 소비 데이터를 기반으로 관심 있는 오피니언 리더 우선 노출.
2. **해외 미디어 연동:** 글로벌 인사이트를 위한 자동 번역 기능 도입.
3. **구독 취소 자동화:** One-click Unsubscribe 프로세스 간소화.
