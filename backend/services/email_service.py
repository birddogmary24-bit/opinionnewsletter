import smtplib
import os
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader
from dotenv import load_dotenv

# Load env vars
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))

class EmailService:
    def __init__(self):
        self.host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        self.port = int(os.getenv('EMAIL_PORT', 587))
        self.user = os.getenv('EMAIL_USER')
        self.password = os.getenv('EMAIL_PASSWORD')
        self.msg_from = os.getenv('EMAIL_FROM', self.user)
        
        # Setup Jinja2
        template_dir = os.path.join(BASE_DIR, 'templates')
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
        
        # Add urlencode filter
        import urllib.parse
        self.jinja_env.filters['urlencode'] = urllib.parse.quote_plus

    def render_template(self, contents, mail_id=None):
        """
        Renders the newsletter HTML template with the given contents.
        """
        template = self.jinja_env.get_template('email_daily.html')
        date_str = datetime.datetime.now().strftime('%Y.%m.%d')
        
        # Base URL for tracking (Seoul region)
        base_tracking_url = "https://opinionnewsletter-web-810426728503.asia-northeast3.run.app"
        
        return template.render(
            contents=contents, 
            date_str=date_str, 
            mail_id=mail_id,
            tracking_url=base_tracking_url
        )

    def send_newsletter(self, to_emails, contents, mail_id=None):
        """
        Sends the newsletter to a list of recipients.
        For MVP, we send individually or in bcc to avoid exposing emails.
        For this demo, we'll loop and send individually to mimic transactional feels or use BCC.
        Using BCC is better for quota.
        """
        if not self.user or not self.password:
            print("⚠️ EMAIL_USER or EMAIL_PASSWORD not set. Skipping email send.")
            print(f"   [Mock Send] Would have sent to {len(to_emails)} recipients.")
            return

        html_content = self.render_template(contents, mail_id=mail_id)
        # Use KST timezone (UTC+9)
        import pytz
        kst = pytz.timezone('Asia/Seoul')
        now_kst = datetime.datetime.now(kst)
        subject = f"오뉴 - 오늘의 오피니언 뉴스 [{now_kst.month}/{now_kst.day}]"

        try:
            # Connect to SMTP Server
            server = smtplib.SMTP(self.host, self.port)
            server.starttls()
            server.login(self.user, self.password)
            
            # Send (Looping for individual customization in future, but simple for now)
            # To avoid spam flags, sending in batches is better. 
            # For MVP, let's just send one by one to ensure delivery in test.
            
            for recipient in to_emails:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = self.msg_from
                msg['To'] = recipient
                
                part = MIMEText(html_content, 'html')
                msg.attach(part)
                
                server.sendmail(self.user, recipient, msg.as_string())
                print(f"✅ Sent email to {recipient}")

            server.quit()
            
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
