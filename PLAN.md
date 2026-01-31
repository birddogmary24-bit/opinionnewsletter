# Implementation Plan: Opinion Newsletter

## Phase 1: Environment Setup & Infrastructure
**Goal:** Initialize the project and secure GCP resources.
1.  **Project Initialization:**
    - Initialize Git repository.
    - Set up `Next.js` project for Frontend (Web + Admin).
    - Set up Python/Node environments for Backend (Crawler/Email).
2.  **GCP Configuration:**
    - Enable APIs: Firestore, Cloud Run/Functions, Cloud Scheduler.
    - Create Service Accounts and download keys (store safely).
    - Set up Firestore Database (Collections: `subscribers`, `contents`, `logs`).

## Phase 2: Backend Development (Data & Logic)
**Goal:** Build the engine that collects content and manages subscriptions.
1.  **Database Design:**
    - Schema for `Contents`: `{ id, title, thumbnail, description, link, author, category, date_scraped }`.
    - Schema for `Subscribers`: `{ email (encrypted), created_at, status }`.
2.  **Crawler Implementation (Python/Node):**
    - **Module A (YouTube):** Use `yt-dlp` or YouTube Data API to fetch latest videos from specific channel IDs.
    - **Module B (Web/RSS):** Use `BeautifulSoup` or RSS parsers for blogs/news columns.
    - **Aggregator:** Script to run modules, deduplicate, and save to Firestore.
3.  **Encryption Utility:**
    - Create helper functions to Encrypt/Decrypt emails using AES.

## Phase 3: Web Application Development (Frontend)
**Goal:** Create the detailed landing page and admin panel.
1.  **Design System:**
    - Install Tailwind CSS.
    - Define color palette (Navy/Grey/White) and Typography (Serif/Sans-serif mix).
2.  **Landing Page (`/`):**
    - Hero section with Value Proposition.
    - "Opinion Leaders" showcase (Grid/Carousel).
    - Subscription Form (Input validation -> API call -> Firestore).
3.  **Admin Panel (`/admin`):**
    - Login screen (`opinion2026`).
    - Dashboard:
        - "Send Test Email" button.
        - Subscriber List (Table with Add/Delete).
        - Content Preview (Optional: See what was scraped today).

## Phase 4: Newsletter Engine & Emailing
**Goal:** Generate and send the HTML email.
1.  **Email Template Design:**
    - Create HTML email layout (using table-based layout for compatibility).
    - **Sections:** Header, "Top 5" (Hero images), "Category List" (Text/Small thumbs), Footer.
2.  **Sender Script:**
    - Fetch today's content from Firestore.
    - Render HTML template with content data.
    - Fetch active subscribers (decrypt emails).
    - Loop and send via SMTP/API.
3.  **Automation:**
    - Deploy Crawler script to Cloud Functions (or Cloud Run Job).
    - Deploy Sender script to Cloud Functions.
    - Configure Cloud Scheduler:
        - Crawler: Every day at 06:00 AM.
        - Sender: Every day at 07:00 AM.

## Phase 5: Testing & Deployment
1.  **Unit Testing:**
    - Test the Crawler on 1-2 targets.
    - Test Email rendering on Gmail Mobile/Desktop, Outlook.
2.  **Security Audit:**
    - Verify Admin auth (basic).
    - Verify Email encryption in DB.
3.  **Deployment:**
    - Deploy Web App to Vercel or Firebase Hosting.
    - Deploy Backend to GCP Cloud Run.

## Phase 6: Post-Launch
1.  **Opinion Leader Expansion:** Add more sources based on user feedback.
2.  **Analytics:** Track open rates (via pixel) - *Future Feature*.

## Immediate Actions (Next Steps for User)
1.  Review PRD and Plan.
2.  Confirm list of Opinion Leaders.
3.  Start with **Phase 1: Environment Setup**.
