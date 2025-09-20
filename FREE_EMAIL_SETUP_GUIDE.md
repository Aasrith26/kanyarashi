# 📧 Free Email Setup Guide

## Overview

This guide will help you set up free email services for the feedback email feature. All the providers listed below are completely free and don't require any paid subscriptions.

## 🆓 Free Email Providers

### 1. Gmail (Recommended)

Gmail is the most reliable and widely used free email service.

#### Setup Steps:
1. **Enable 2-Factor Authentication**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Environment Configuration**:
   ```env
   EMAIL_PROVIDER=gmail
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=Innomatics Research Lab
   REPLY_TO_EMAIL=your-email@gmail.com
   USE_TLS=true
   USE_SSL=false
   ```

#### Gmail Limits:
- **Daily Limit**: 500 emails per day
- **Rate Limit**: 100 emails per hour
- **Recipients**: Up to 500 recipients per email

### 2. Outlook/Hotmail (Free)

Microsoft's free email service with good reliability.

#### Setup Steps:
1. **Create Outlook Account** (if you don't have one):
   - Go to [Outlook.com](https://outlook.com)
   - Sign up for a free account

2. **Enable Less Secure Apps** (if needed):
   - Go to [Microsoft Account Security](https://account.microsoft.com/security)
   - Enable "Less secure app access" (temporarily)

3. **Environment Configuration**:
   ```env
   EMAIL_PROVIDER=outlook
   SMTP_USERNAME=your-email@outlook.com
   SMTP_PASSWORD=your-password
   FROM_EMAIL=your-email@outlook.com
   FROM_NAME=Innomatics Research Lab
   REPLY_TO_EMAIL=your-email@outlook.com
   USE_TLS=true
   USE_SSL=false
   ```

#### Outlook Limits:
- **Daily Limit**: 300 emails per day
- **Rate Limit**: 30 emails per minute
- **Recipients**: Up to 100 recipients per email

### 3. Yahoo Mail (Free)

Yahoo's free email service with decent reliability.

#### Setup Steps:
1. **Create Yahoo Account** (if you don't have one):
   - Go to [Yahoo Mail](https://mail.yahoo.com)
   - Sign up for a free account

2. **Generate App Password**:
   - Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
   - Enable 2-Step Verification
   - Generate App Password for "Mail"

3. **Environment Configuration**:
   ```env
   EMAIL_PROVIDER=yahoo
   SMTP_USERNAME=your-email@yahoo.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=your-email@yahoo.com
   FROM_NAME=Innomatics Research Lab
   REPLY_TO_EMAIL=your-email@yahoo.com
   USE_TLS=true
   USE_SSL=false
   ```

#### Yahoo Limits:
- **Daily Limit**: 500 emails per day
- **Rate Limit**: 100 emails per hour
- **Recipients**: Up to 100 recipients per email

### 4. Custom SMTP (Other Free Providers)

You can use any free email provider that supports SMTP.

#### Popular Free SMTP Providers:
- **ProtonMail**: Requires paid plan for SMTP
- **Tutanota**: Requires paid plan for SMTP
- **Zoho Mail**: Free tier available
- **FastMail**: Free trial available

#### Zoho Mail Setup:
1. **Create Zoho Account**:
   - Go to [Zoho Mail](https://www.zoho.com/mail/)
   - Sign up for free plan

2. **Environment Configuration**:
   ```env
   EMAIL_PROVIDER=custom_smtp
   SMTP_SERVER=smtp.zoho.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@yourdomain.com
   SMTP_PASSWORD=your-password
   FROM_EMAIL=your-email@yourdomain.com
   FROM_NAME=Innomatics Research Lab
   REPLY_TO_EMAIL=your-email@yourdomain.com
   USE_TLS=true
   USE_SSL=false
   ```

## 🔧 Configuration Examples

### Complete .env Example (Gmail):
```env
# Database
DATABASE_URL=postgresql://recur_ai_app:app_password_123@localhost:5432/recur_ai_db

# AWS S3
S3_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY=your-aws-access-key
AWS_SECRET_KEY=your-aws-secret-key
AWS_REGION=ap-south-1

# Email Configuration (Gmail - FREE)
EMAIL_PROVIDER=gmail
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Innomatics Research Lab
REPLY_TO_EMAIL=your-email@gmail.com
USE_TLS=true
USE_SSL=false

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

## 🧪 Testing Your Email Setup

### 1. Run the Test Script:
```bash
python test_feedback_system.py
```

### 2. Manual Test:
```python
from email_service import send_feedback_email_async

# Test email sending
result = await send_feedback_email_async(
    candidate_name="Test Candidate",
    candidate_email="test@example.com",
    feedback_content="This is a test feedback email.",
    job_title="Software Engineer"
)

print(f"Email sent: {result.success}")
if not result.success:
    print(f"Error: {result.error_message}")
```

## 🚨 Common Issues & Solutions

### Gmail Issues:

#### "Authentication failed"
- **Solution**: Use App Password instead of regular password
- **Steps**: Enable 2FA → Generate App Password → Use 16-character password

#### "Less secure app access"
- **Solution**: Enable 2-Factor Authentication and use App Password
- **Note**: Gmail no longer supports "less secure apps"

#### "Daily limit exceeded"
- **Solution**: Wait 24 hours or use multiple Gmail accounts
- **Alternative**: Switch to Outlook or Yahoo

### Outlook Issues:

#### "Authentication failed"
- **Solution**: Enable "Less secure app access" temporarily
- **Better Solution**: Use Microsoft Graph API (requires setup)

#### "Connection refused"
- **Solution**: Check if SMTP is enabled in your Outlook settings
- **Alternative**: Use Outlook.com instead of custom domain

### Yahoo Issues:

#### "Authentication failed"
- **Solution**: Use App Password, not regular password
- **Steps**: Enable 2FA → Generate App Password

#### "Connection timeout"
- **Solution**: Check firewall settings
- **Alternative**: Try different network or VPN

## 📊 Email Provider Comparison

| Provider | Daily Limit | Rate Limit | Reliability | Setup Difficulty |
|----------|-------------|------------|-------------|------------------|
| Gmail    | 500         | 100/hour   | Excellent   | Easy            |
| Outlook  | 300         | 30/minute  | Good        | Easy            |
| Yahoo    | 500         | 100/hour   | Good        | Medium          |
| Zoho     | 200         | 50/hour    | Good        | Medium          |

## 🔒 Security Best Practices

### 1. Use App Passwords
- Never use your main email password
- Generate app-specific passwords
- Rotate passwords regularly

### 2. Enable 2-Factor Authentication
- Required for most providers
- Adds extra security layer
- Required for app passwords

### 3. Monitor Usage
- Track email sending limits
- Monitor for unusual activity
- Set up alerts for failures

### 4. Backup Configuration
- Keep multiple email accounts ready
- Document your setup process
- Test failover procedures

## 🚀 Production Recommendations

### For Small Teams (< 100 emails/day):
- **Gmail**: Best choice, reliable and easy
- **Outlook**: Good alternative if Gmail has issues

### For Medium Teams (100-500 emails/day):
- **Multiple Gmail accounts**: Rotate between accounts
- **Gmail + Outlook**: Use both providers
- **Yahoo**: Additional backup option

### For Large Teams (500+ emails/day):
- **Multiple providers**: Gmail + Outlook + Yahoo
- **Load balancing**: Distribute emails across providers
- **Consider paid services**: SendGrid, Mailgun, etc.

## 📞 Support

### Gmail Support:
- [Gmail Help Center](https://support.google.com/mail/)
- [App Passwords Guide](https://support.google.com/accounts/answer/185833)

### Outlook Support:
- [Outlook Help Center](https://support.microsoft.com/en-us/outlook)
- [SMTP Settings](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-for-outlook-com-d088b986-291d-42b8-9564-9c414e2aa040)

### Yahoo Support:
- [Yahoo Mail Help](https://help.yahoo.com/kb/mail)
- [App Passwords Guide](https://help.yahoo.com/kb/generate-third-party-passwords-sln15241.html)

---

## ✅ Quick Setup Checklist

- [ ] Choose email provider (Gmail recommended)
- [ ] Create/verify email account
- [ ] Enable 2-Factor Authentication
- [ ] Generate App Password
- [ ] Update .env file with credentials
- [ ] Test email sending
- [ ] Monitor daily limits
- [ ] Set up backup provider
- [ ] Document configuration
- [ ] Train team on usage

Your free email system is now ready to send professional feedback emails! 🎉
