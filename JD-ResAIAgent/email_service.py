"""
Email Service for Feedback Emails
Handles sending personalized feedback emails to candidates
"""

import os
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging
from jinja2 import Template
from pydantic import BaseModel, EmailStr
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailConfig(BaseModel):
    """Email configuration model for free email services"""
    provider: str = "gmail"  # gmail, outlook, yahoo, custom_smtp
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    from_email: str = "noreply@innomaticsresearch.com"
    from_name: str = "Innomatics Research Lab"
    reply_to: Optional[str] = None
    use_tls: bool = True
    use_ssl: bool = False

class FeedbackEmailData(BaseModel):
    """Data model for feedback email"""
    candidate_name: str
    candidate_email: EmailStr
    feedback_content: str
    job_title: Optional[str] = None
    company_name: str = "Innomatics Research Lab"
    recruiter_name: Optional[str] = None
    analysis_summary: Optional[str] = None

class EmailResult(BaseModel):
    """Result of email sending operation"""
    success: bool
    message_id: Optional[str] = None
    error_message: Optional[str] = None
    status: str = "sent"  # sent, failed, bounced

class EmailService:
    """Email service for sending feedback emails using free SMTP providers"""
    
    def __init__(self, config: EmailConfig):
        self.config = config
        self._setup_smtp_config()
    
    def _setup_smtp_config(self):
        """Setup SMTP configuration based on provider"""
        if self.config.provider == "gmail":
            self.config.smtp_server = "smtp.gmail.com"
            self.config.smtp_port = 587
            self.config.use_tls = True
            self.config.use_ssl = False
        elif self.config.provider == "outlook":
            self.config.smtp_server = "smtp-mail.outlook.com"
            self.config.smtp_port = 587
            self.config.use_tls = True
            self.config.use_ssl = False
        elif self.config.provider == "yahoo":
            self.config.smtp_server = "smtp.mail.yahoo.com"
            self.config.smtp_port = 587
            self.config.use_tls = True
            self.config.use_ssl = False
        elif self.config.provider == "custom_smtp":
            # Use custom SMTP settings from environment
            pass
    
    async def send_feedback_email(
        self, 
        email_data: FeedbackEmailData,
        custom_subject: Optional[str] = None
    ) -> EmailResult:
        """Send a feedback email to a candidate using SMTP"""
        
        try:
            return await self._send_via_smtp(email_data, custom_subject)
                
        except Exception as e:
            logger.error(f"Failed to send email to {email_data.candidate_email}: {str(e)}")
            return EmailResult(
                success=False,
                error_message=str(e),
                status="failed"
            )
    
    
    async def _send_via_smtp(
        self, 
        email_data: FeedbackEmailData,
        custom_subject: Optional[str] = None
    ) -> EmailResult:
        """Send email via SMTP using free email providers"""
        
        if not all([self.config.smtp_server, self.config.smtp_port, 
                   self.config.smtp_username, self.config.smtp_password]):
            raise ValueError("SMTP configuration incomplete. Please check your email credentials.")
        
        # Generate email content
        subject = custom_subject or self._generate_subject(email_data)
        html_content = self._generate_html_content(email_data)
        text_content = self._generate_text_content(email_data)
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{self.config.from_name} <{self.config.from_email}>"
        msg['To'] = email_data.candidate_email
        msg['Subject'] = subject
        
        if self.config.reply_to:
            msg['Reply-To'] = self.config.reply_to
        
        # Add text and HTML parts
        text_part = MIMEText(text_content, 'plain', 'utf-8')
        html_part = MIMEText(html_content, 'html', 'utf-8')
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Generate unique message ID
        message_id = f"<{uuid.uuid4()}@innomaticsresearch.com>"
        msg['Message-ID'] = message_id
        
        # Send via SMTP
        await asyncio.to_thread(
            self._send_smtp_message,
            msg,
            email_data.candidate_email
        )
        
        return EmailResult(
            success=True,
            message_id=message_id,
            status="sent"
        )
    
    def _send_smtp_message(self, msg: MIMEMultipart, to_email: str):
        """Send message via SMTP (synchronous) with proper connection handling"""
        try:
            if self.config.use_ssl:
                # Use SSL connection
                with smtplib.SMTP_SSL(self.config.smtp_server, self.config.smtp_port) as server:
                    server.login(self.config.smtp_username, self.config.smtp_password)
                    server.send_message(msg, to_addrs=[to_email])
            else:
                # Use TLS connection (most common for free providers)
                with smtplib.SMTP(self.config.smtp_server, self.config.smtp_port) as server:
                    if self.config.use_tls:
                        server.starttls()
                    server.login(self.config.smtp_username, self.config.smtp_password)
                    server.send_message(msg, to_addrs=[to_email])
        except smtplib.SMTPAuthenticationError as e:
            raise ValueError(f"SMTP authentication failed. Please check your email credentials. Error: {e}")
        except smtplib.SMTPRecipientsRefused as e:
            raise ValueError(f"Recipient email address was refused. Error: {e}")
        except smtplib.SMTPServerDisconnected as e:
            raise ValueError(f"SMTP server disconnected. Please check your connection settings. Error: {e}")
        except Exception as e:
            raise ValueError(f"Failed to send email via SMTP. Error: {e}")
    
    def _generate_subject(self, email_data: FeedbackEmailData) -> str:
        """Generate email subject line"""
        if email_data.job_title:
            return f"Feedback on Your Application - {email_data.job_title} Position"
        return "Feedback on Your Application - Innomatics Research Lab"
    
    def _generate_html_content(self, email_data: FeedbackEmailData) -> str:
        """Generate HTML email content"""
        template_str = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback from Innomatics Research Lab</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .feedback-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
        }
        .signature {
            margin-top: 30px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Innomatics Research Lab</div>
            <p>Empowering Innovation Through Research</p>
        </div>
        
        <div class="content">
            <p>Dear {{ candidate_name }},</p>
            
            <p>Thank you for your interest in opportunities at Innomatics Research Lab. We have carefully reviewed your application and resume, and we appreciate the time and effort you put into your submission.</p>
            
            <p>As part of our commitment to supporting aspiring professionals in the technology and research fields, we would like to provide you with some constructive feedback that we hope will be valuable for your career development.</p>
            
            <div class="feedback-section">
                <h3 style="color: #007bff; margin-top: 0;">Our Feedback</h3>
                {{ feedback_content | safe }}
            </div>
            
            <p>We encourage you to continue developing your skills and exploring opportunities in the technology sector. The field is constantly evolving, and there are always new areas to explore and master.</p>
            
            <p>If you have any questions about this feedback or would like to discuss your career development further, please don't hesitate to reach out to us.</p>
            
            <div class="signature">
                <p>Best regards,<br>
                <strong>Innomatics Research Lab Team</strong><br>
                <em>Empowering the next generation of innovators</em></p>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent from Innomatics Research Lab. If you have any questions, please contact us.</p>
            <p>&copy; 2024 Innomatics Research Lab. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """
        
        template = Template(template_str)
        return template.render(
            candidate_name=email_data.candidate_name,
            feedback_content=email_data.feedback_content,
            company_name=email_data.company_name
        )
    
    def _generate_text_content(self, email_data: FeedbackEmailData) -> str:
        """Generate plain text email content"""
        return f"""
Dear {email_data.candidate_name},

Thank you for your interest in opportunities at Innomatics Research Lab. We have carefully reviewed your application and resume, and we appreciate the time and effort you put into your submission.

As part of our commitment to supporting aspiring professionals in the technology and research fields, we would like to provide you with some constructive feedback that we hope will be valuable for your career development.

OUR FEEDBACK:
{email_data.feedback_content}

We encourage you to continue developing your skills and exploring opportunities in the technology sector. The field is constantly evolving, and there are always new areas to explore and master.

If you have any questions about this feedback or would like to discuss your career development further, please don't hesitate to reach out to us.

Best regards,
Innomatics Research Lab Team
Empowering the next generation of innovators

---
This email was sent from Innomatics Research Lab. If you have any questions, please contact us.
© 2024 Innomatics Research Lab. All rights reserved.
        """

# Global email service instance
_email_service: Optional[EmailService] = None

def get_email_service() -> EmailService:
    """Get the global email service instance"""
    global _email_service
    
    if _email_service is None:
        config = EmailConfig(
            provider=os.getenv("EMAIL_PROVIDER", "gmail"),
            smtp_server=os.getenv("SMTP_SERVER"),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_username=os.getenv("SMTP_USERNAME"),
            smtp_password=os.getenv("SMTP_PASSWORD"),
            from_email=os.getenv("FROM_EMAIL", "noreply@innomaticsresearch.com"),
            from_name=os.getenv("FROM_NAME", "Innomatics Research Lab"),
            reply_to=os.getenv("REPLY_TO_EMAIL"),
            use_tls=os.getenv("USE_TLS", "true").lower() == "true",
            use_ssl=os.getenv("USE_SSL", "false").lower() == "true"
        )
        _email_service = EmailService(config)
    
    return _email_service

async def send_feedback_email_async(
    candidate_name: str,
    candidate_email: str,
    feedback_content: str,
    job_title: Optional[str] = None,
    recruiter_name: Optional[str] = None,
    custom_subject: Optional[str] = None
) -> EmailResult:
    """Convenience function to send feedback email"""
    
    email_data = FeedbackEmailData(
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        feedback_content=feedback_content,
        job_title=job_title,
        recruiter_name=recruiter_name
    )
    
    email_service = get_email_service()
    return await email_service.send_feedback_email(email_data, custom_subject)
