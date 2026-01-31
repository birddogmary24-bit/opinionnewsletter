# 제품 요구사항 정의서 (PRD): 오뉴 (ONEW)

## 1. 프로젝트 개요 (Project Overview)
**프로젝트 명:** 오뉴 (ONEW) - Opinion Newsletter
**설명:** 경제, 정치, 사회, 교육, 문화, IT/테크 분야의 오피니언 리더들이 발신하는 고품질 콘텐츠(YouTube, 블로그, 기사)를 큐레이션하여 제공하는 프리미엄 데일리 뉴스레터 서비스.
**목표:** 바쁜 전문가들에게 신뢰할 수 있는 전문가들의 인사이트를 요약하여 매일 아침 07:00 AM (KST)에 배달함.

## 2. 타겟 오디언스 (Target Audience)
- **사용자층:** 시사 및 경제 트렌드에 관심이 많은 30-70대 전문직 및 직장인.
- **톤앤매너:** 프리미엄(Premium), 신뢰감(Institutional), 공신력 있는 분위기. "The Economist" 또는 "New York Times" 스타일의 미학적 지향.

## 3. 제품 기능 (Product Features)

### 3.1. 브랜딩 및 디자인 (Branding & Design - 구현 완료)
- **브랜드명:** 오뉴 (ONEW) - "Opinion Newsletter"의 약자.
- **테마:** 프리미엄 다크 모드 (Slate-950) 및 유동적인 그라데이션 (Blue/Purple/Amber) 적용.
- **타이포그래피:** 깨끗하고 전문적인 느낌을 위해 Pretendard (한글) 및 Inter/System 폰트 사용.
- **애니메이션:** 미세한 호버 효과(Subtle hover effects), 통통 튀는 CTA 배지, 앰비언트 배경 블러(Ambient background blurs).
- **반응형 디자인:** 이동 중에도 읽기 편하도록 모바일 우선(Mobile-first) 디자인 적용.

### 3.2. 구독 웹 앱 (Subscription Web App - 구현 완료)
- **랜딩 페이지 (Landing Page):** 
  - 전달력이 높은 가치 제안(Value Proposition)이 포함된 히어로 섹션.
  - 간결한 헤더: 좌측 "오뉴" 로고 + 우측 "구독하기" 버튼.
  - 이메일 유효성 검사 및 개인정보 처리방침 동의 체크박스(필수)가 포함된 구독 폼.
  - 콘텐츠 미리보기: 상위 30개 이상의 아이템을 보여주는 "오늘의 뉴스레터 미리보기" 섹션.
  - 정렬 및 필터링: 오피니언 리더별 (예: 슈카월드, 매경 월가월부) 카테고리 뷰.

### 3.3. 콘텐츠 수집기 및 크롤러 (Aggregator & Crawler - 구현 완료)
- **자동 수집:** 매일 아침 06:00 AM (KST)에 크롤러 실행.
- **수집 대상:** 주요 YouTube 채널 및 오피니언 리더 블로그.
- **데이터 추출:** 정제된 한글 제목, 썸네일(Thumbnail), 발행처 이름, 원문 URL, 수집 날짜.
- **데이터베이스:** 실시간 동기화를 위한 GCP Firestore 사용.

### 3.4. 관리자 대시보드 (Administrative Dashboard - 구현 완료)
- **URL:** `/admin` (비밀번호 `opinion2026`으로 보호됨).
- **대시보드 기능:**
  - **구독자 관리:** 활성 구독자 목록 확인 및 가입일 조회.
  - **계정 삭제:** 실수로 인한 삭제를 방지하기 위해 확인 팝업이 포함된 구독자 삭제 기능.
  - **수동 트리거:** 전체 사용자 또는 개별 테스트 발송을 위한 "뉴스레터 발송" 버튼.
  - **통계 및 히스토리 (Stats & History):** 
    - 일별 발송량을 시각화한 실시간 차트.
    - 수신자 수와 타임스탬프를 포함한 상세 `mail_history` 로그.
  - **요약 통계:** 전체 구독자 및 활성 구독자 수 현황.

### 3.6. 콘텐츠 큐레이션 규칙 (Curation Rules - 구현 완료)
- **최신성 필터링**: 24시간 이내에 수집(scraped)된 데이터만 선별하여 제공.
- **수량 제한**: 전체 콘텐츠 개수를 최대 30개로 한정하여 가독성 유지.
- **순위 산정**: 전체 30개 콘텐츠 중 **조회수(view_count)**가 가장 높은 상위 3개를 "Top 3 Highlights"로 선정.

## 4. 기술 아키텍처 (Technical Architecture)
**클라우드 인프라:** Google Cloud Platform (GCP)
- **Frontend/API:** **Cloud Run**에 배포된 Next.js (App Router).
- **Database:** Google Cloud Firestore (NoSQL).
- **Automation:** Cloud Run Jobs를 실행하는 Cloud Scheduler (Crawler/Sender 트리거).
- **Email Service:** 보안 SMTP 통합이 포함된 Nodemailer.
- **Styling:** Tailwind CSS 및 Lucide Icons.

## 5. 배포 상태 (Deployment Status)
- **상태:** **Production Ready / 배포 완료**
- **클라우드 계정:** GCP (`birddogmary24@gmail.com`)
- **Git Repo:** 최신 UI 및 큐레이션 로직 (24h 필터, 30개 제한, 조회수 기반 Top 3) 반영 완료.
- **CI/CD:** Cloud Run (GCP CLI)을 통한 수동 배포 프로세스.

## 6. 디자인 및 UX 원칙 (Design & UX Principles)
- **미학(Aesthetics):** 미니멀리즘, 고대비, 프리미엄 다크 테마. 
- **사용자 흐름 (User Flow):** 원클릭 구독 -> 즉시 확인 -> 매일 배송.
- **시각화 (Visuals):** 상위 콘텐츠에는 큰 썸네일을 사용하고, 아카이브는 깔끔한 리스트 뷰로 구성.

## 7. 향후 로드맵 (Future Roadmap - 계획 중)
1.  **오픈율 분석 (Open Rate Analytics):** 1x1 픽셀을 통한 이메일 개봉 추적.
2.  **맞춤형 카테고리:** 가입 시 사용자가 특정 관심 분야를 선택할 수 있게 개선.
3.  **수집원 확대:** 해외 뉴스 미디어 (FT, NYT 등) 추가 및 자동 번역 기능 연동.
