# Product Requirements Document (PRD): 오뉴 (ONEW)

## 1. Project Overview
**Project Name:** 오뉴 (ONEW) - Opinion Newsletter
**Description:** A premium daily newsletter service that aggregates high-quality content (YouTube, Blogs, Articles) from opinion leaders in Economy, Politics, Society, Education, Culture, IT, and Tech.
**Goal:** To provide busy professionals with a curated summary of insights from trusted voices every morning at 07:00 AM KST.

## 2. Target Audience
- **Demographics:** Professionals aged 30-70 interested in current affairs and economic trends.
- **Tone:** Premium, Institutional, and Trustworthy. "The Economist" or "New York Times" inspired aesthetic.

## 3. Product Features

### 3.1. Branding & Design (Implemented)
- **Brand Name:** 오뉴 (ONEW) - "Opinion Newsletter" abbreviation.
- **Theme:** Premium Dark Mode (Slate-950) with fluid gradients (Blue/Purple/Amber).
- **Typography:** Pretendard (Korean) & Inter/System fonts for a clean, professional look.
- **Animations:** Subtle hover effects, bouncing CTA badges, and ambient background blurs.
- **Responsive:** Mobile-first design for reading on the go.

### 3.2. Subscription Web App (Implemented)
- **Landing Page:** 
  - Hero section with high-impact value proposition.
  - Simplified header: "오뉴" Logo (Left) + "구독하기" Button (Right).
  - Subscription form with email validation and required Privacy Policy agreement (Checkbox).
  - Content Preview: "Today's Newsletter Preview" showing top 30+ items.
  - Sorting/Filtering: Categorized view by Opinion Leader (e.g., 슈카월드, 매경 월가월부).

### 3.3. Content Aggregator & Crawler (Implemented)
- **Automated Collection:** Daily crawler runs at 06:00 AM KST.
- **Sources:** Major YouTube channels and opinion leader blogs.
- **Data Extracted:** Korean Titles (Sanitized), Thumbnails, Publisher Name, Original URL, Scrape Date.
- **Database:** Firestore (GCP) for real-time synchronization.

### 3.4. Administrative Dashboard (Implemented)
- **URL:** `/admin` (Protected with password: `opinion2026`).
- **Dashboard Features:**
  - **Subscriber Management:** View active subscriber list, see join dates.
  - **Account Deletion:** Delete subscribers with a confirmation popup to prevent accidental removal.
  - **Manual Trigger:** "Send Newsletter" button for both bulk (all active users) or individual testing.
  - **Stats & History:** 
    - Real-time visualization of sending volume (Daily Chart).
    - Detailed `mail_history` log showing recipient counts and timestamps.
  - **Stats:** Overview of total and active subscribers.

### 3.5. Newsletter Service (Implemented)
- **Transmission:** Daily at 07:00 AM KST via automated scheduler.
- **Format:** Responsive HTML Email.
- **Content Structure:** Top 5 "Focus" items followed by categorized "Archive" list.

## 4. Technical Architecture
**Cloud Infrastructure:** Google Cloud Platform (GCP)
- **Frontend/API:** Next.js (App Router) deployed on **Cloud Run**.
- **Database:** Google Cloud Firestore (NoSQL).
- **Automation:** Cloud Scheduler triggering Cloud Run Jobs (Crawler/Sender).
- **Email Service:** Nodemailer with secure SMTP integration.
- **Styling:** Tailwind CSS with Lucide Icons.

## 5. Deployment Status
- **Status:** **Production Ready / Deployed**
- **Cloud Account:** GCP (`birddogmary24@gmail.com`)
- **Git Repo:** Pushed and synced with latest UI optimizations (Mobile & Typography refinements).
- **CI/CD:** Manual deployment via Cloud Run (GCP CLI).

## 6. Design & UX Principles
- **Aesthetics:** Minimalist, high-contrast, premium dark theme. 
- **User Flow:** Single-click subscription -> Instant confirmation -> Daily delivery.
- **Visuals:** Larger thumbnails for top content, clean list view for archives.

## 7. Future Roadmap (Planned)
1.  **Open Rate Analytics:** Tracking email opens via 1x1 pixel.
2.  **Personalized Categories:** Allow users to select specific interests upon signup.
3.  **Expanding Sources:** Adding international news media (FT, NYT) with auto-translation.
