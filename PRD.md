# Product Requirements Document (PRD): Opinion Newsletter

## 1. Project Overview
**Project Name:** Opinion Newsletter (Working Title)
**Description:** A premium daily newsletter service that aggregates high-quality content (YouTube, Blogs, Articles) from opinion leaders in Economy, Politics, Society, Education, Culture, IT, and Tech.
**Goal:** To provide busy professionals (Target 30-70s males) with a curated summary of insights from trusted voices every morning.

## 2. Target Audience
- **Demographics:** Males aged 30-70.
- **Psychographics:** Interest in self-improvement, current affairs, economic trends, and professional growth. Prefers "Institutional" and reliable tone over light or purely entertainment-focused content.
- **Pain Points:** Information overload, lack of time to find quality content from scattered sources (YouTube, News sites, etc.).

## 3. Product Features

### 3.1. Content Aggregation & Management (Back-office)
- **Content Sources:**
  - YouTube Channels (Specific Opinion Leaders).
  - Naver Blogs / Branded Columns.
  - Major News Media Columns.
  - *Must be publicly accessible via web crawling.*
- **Data Collection (Crawler):**
  - **Frequency:** Daily (Automated).
  - **Extracted Data:** Thumbnail URL, Title, Content Summary (Description), Opinion Leader Name/Source, Original Link, Publish Date.
  - **Storage:** Database (Firestore) to store legitimate meta-content.

### 3.2. Newsletter Service
- **Distribution:** Daily at 07:00 AM KST.
- **Format:** HTML Responsive Email (Mobile & PC optimized).
- **Structure:**
  - **Header:** Branding (Premium/Institutional feel), Date.
  - **Core Content (Top 5):**
    - Layout: Large Thumbnail, Title, Leader Name, Brief Summary.
    - Selection Logic: Manually selected or Algorithmically (e.g., highest views/recent) - *Initial phase: automated based on recency/popularity.*
  - **Categorized Content (~30 items):**
    - Layout: List/Grid view, smaller thumbnails or text-heavy to save space.
    - Pagination/Scroll: "Read More" links if too long for email client (though email usually doesn't have pagination, will implement "Best 30" via clean layout categories).
    - Categories: Economy, Politics, IT/Tech, Culture, etc.
  - **Footer:** Unsubscribe link, Privacy Policy link, Contact.

### 3.3. Subscription Website (Web App)
- **Landing Page:**
  - Premium design with "Institutional/Trusted" aesthetic.
  - Service Introduction.
  - Rotating Banners of Opnion Leaders (Images).
  - **Call to Action:** Email Input Field + Subscribe Button.
- **Security:**
  - Email encryption (AES-256 or equivalent) for storage.
  - HTTPS enforced.
- **Design Guidelines:**
  - **Vibe:** Reliable, Classic but Modern, "The Economist" or "New York Times" feel.
  - **Color Palette:** Deep Blues, Greys, Serif fonts for headings (Trustworthy).

### 3.4. Admin Dashboard
- **Access Control:** Password protected (`opinion2026`).
- **Subscriber Management:**
  - View list (masked/encrypted).
  - Add/Delete subscribers manually.
- **Newsletter Operations:**
  - Manual Trigger / Test Send (Individual or Bulk).
  - Status View (Last run status).

## 4. Technical Architecture
**Cloud Provider:** Google Cloud Platform (GCP)
- **Frontend (Web):** Next.js (React) + Tailwind CSS.
- **Backend (API/Crawler):** Python (FastAPI or purely Cloud Functions) or Node.js.
- **Database:** Google Firestore (NoSQL) for content and subscribers.
- **Scheduling:** Cloud Scheduler (for 7 AM trigger).
- **Email Service:** Nodemailer (with Gmail SMTP for MVP) or SendGrid/Gun (for Production).
- **Hosting:** Cloud Run or Firebase Hosting.

## 5. Implementation Roadmap (Summary)
1.  **Setup:** GCP Project config, Repository init.
2.  **Core Logic:** Build Crawler & Database Schema.
3.  **Admin/Backend:** API for managing subs and triggering sends.
4.  **Frontend:** Landing page & Admin UI.
5.  **Polishing:** Design refinement, Email template testing.

## 6. Design & User Experience (UX)
- **Responsive:** Mobile-first approach for the Newsletter (since most open emails on phone).
- **Aesthetics:**
  - *Avoid:* Neon colors, playful fonts, clutter.
  - *Adopt:* Clean lines, high contrast text, professional imagery.

## 7. Open Questions / Next Steps
- Finalize list of 5-10 Opinion Leaders for MVP.
- Confirm Email Service Provider (Gmail limit is 500/day, ok for testing).
