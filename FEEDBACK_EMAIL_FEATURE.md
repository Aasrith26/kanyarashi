# 📧 Feedback Email Feature

## Overview

The Feedback Email feature allows recruiters to send personalized, AI-generated feedback emails to candidates after resume analysis. This feature helps maintain professional relationships and provides constructive guidance to candidates.

## 🚀 Features

### ✨ Core Functionality
- **AI-Generated Feedback**: Personalized feedback based on resume analysis and job requirements
- **Professional Email Templates**: Beautiful HTML emails with Innomatics Research Lab branding
- **Individual & Bulk Sending**: Send feedback to single candidates or multiple candidates at once
- **Email Tracking**: Track email delivery, opens, and clicks
- **Customizable Content**: Edit AI-generated feedback before sending
- **Email History**: View all sent feedback emails for each analysis session

### 🎯 Key Benefits
- **Professional Branding**: Maintains Innomatics Research Lab's professional image
- **Constructive Feedback**: Helps candidates improve their skills and applications
- **Time Efficient**: Automated feedback generation saves recruiter time
- **Scalable**: Send feedback to multiple candidates simultaneously
- **Trackable**: Monitor email engagement and delivery status

## 🏗️ Architecture

### Backend Components

#### 1. Database Schema
```sql
-- feedback_emails table
CREATE TABLE feedback_emails (
    id UUID PRIMARY KEY,
    resume_id UUID REFERENCES resumes(id),
    analysis_session_id UUID REFERENCES analysis_sessions(id),
    recruiter_id UUID REFERENCES users(id),
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    feedback_content TEXT NOT NULL,
    email_subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    email_provider_message_id VARCHAR(500)
);
```

#### 2. Email Service (`email_service.py`)
- **Free SMTP Providers**: Gmail, Outlook, Yahoo, and custom SMTP support
- **Professional Templates**: Beautiful, responsive email templates
- **Error Handling**: Comprehensive error tracking and logging
- **Connection Management**: Automatic TLS/SSL handling

#### 3. Feedback Generator (`feedback_generator.py`)
- **LLM Integration**: Uses OpenAI GPT models for feedback generation
- **Personalized Content**: Tailored feedback based on resume analysis
- **Professional Tone**: Maintains encouraging, constructive language
- **Fallback System**: Provides default feedback if AI generation fails

#### 4. API Endpoints
- `POST /feedback/generate/{resume_id}` - Generate feedback preview
- `POST /feedback/send/{resume_id}` - Send individual feedback email
- `POST /feedback/send-bulk` - Send bulk feedback emails
- `GET /feedback/history/{session_id}` - View feedback email history

### Frontend Components

#### 1. FeedbackModal (`FeedbackModal.tsx`)
- **Preview Generation**: Shows AI-generated feedback before sending
- **Content Editing**: Allows customization of feedback content
- **Email Preview**: Shows how the email will appear to candidates
- **Send Confirmation**: Confirms email delivery status

#### 2. BulkFeedbackModal (`BulkFeedbackModal.tsx`)
- **Candidate Selection**: Choose multiple candidates for bulk feedback
- **Progress Tracking**: Shows sending progress and results
- **Error Handling**: Displays individual success/failure status
- **Summary Report**: Provides detailed results of bulk operation

#### 3. Enhanced Candidate Cards
- **Send Feedback Button**: Individual feedback sending option
- **Bulk Actions**: Select multiple candidates for bulk operations
- **Visual Indicators**: Clear feedback status and actions

## 🔧 Setup Instructions

### 1. Database Migration
```bash
# Run the migration script
psql -d your_database -f database/migrate_feedback_emails.sql
```

### 2. Environment Configuration
Add these variables to your `.env` file:

```env
# Email Configuration (FREE providers only)
# Option 1: Gmail (FREE - recommended)
EMAIL_PROVIDER=gmail
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
# Note: Use App Password, not your regular Gmail password
# Enable 2FA and generate App Password: https://support.google.com/accounts/answer/185833

# Option 2: Outlook/Hotmail (FREE)
# EMAIL_PROVIDER=outlook
# SMTP_USERNAME=your-email@outlook.com
# SMTP_PASSWORD=your-password

# Option 3: Yahoo (FREE)
# EMAIL_PROVIDER=yahoo
# SMTP_USERNAME=your-email@yahoo.com
# SMTP_PASSWORD=your-app-password

# Email Settings
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Innomatics Research Lab
REPLY_TO_EMAIL=your-email@gmail.com
USE_TLS=true
USE_SSL=false

# OpenAI Configuration (for feedback generation)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
```

### 3. Install Dependencies
```bash
# Backend dependencies (FREE email providers)
pip install jinja2 email-validator

# Frontend dependencies (already included)
npm install
```

### 4. Email Provider Setup

#### Gmail Setup (Recommended - FREE)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password (not your regular password)
3. Use the App Password in your environment variables
4. See [FREE_EMAIL_SETUP_GUIDE.md](FREE_EMAIL_SETUP_GUIDE.md) for detailed instructions

#### Outlook Setup (FREE Alternative)
1. Create a free Outlook account
2. Enable "Less secure app access" (temporarily)
3. Use your Outlook credentials in environment variables

#### Yahoo Setup (FREE Alternative)
1. Enable 2-Factor Authentication on your Yahoo account
2. Generate an App Password
3. Use the App Password in your environment variables

## 📱 User Interface

### Individual Feedback Flow
1. **View Analysis Results**: See candidate rankings and scores
2. **Click "Send Feedback"**: Opens feedback modal
3. **Review AI-Generated Content**: Preview personalized feedback
4. **Customize if Needed**: Edit subject or content
5. **Send Email**: Confirm and send to candidate
6. **Track Delivery**: Monitor email status

### Bulk Feedback Flow
1. **Select Candidates**: Choose multiple candidates
2. **Click "Send Bulk Feedback"**: Opens bulk modal
3. **Review Selection**: Confirm candidate list
4. **Set Custom Subject**: Optional custom subject line
5. **Send to All**: Process all feedback emails
6. **View Results**: See success/failure status for each

## 🎨 Email Template

### Design Features
- **Professional Branding**: Innomatics Research Lab logo and colors
- **Responsive Layout**: Works on all devices
- **Clear Typography**: Easy to read content
- **Structured Content**: Well-organized feedback sections
- **Call-to-Action**: Encourages candidate engagement

### Content Structure
1. **Header**: Company branding and greeting
2. **Acknowledgement**: Thanks for application
3. **Feedback Section**: AI-generated personalized feedback
4. **Encouragement**: Motivational closing
5. **Signature**: Professional sign-off
6. **Footer**: Company information and contact details

## 🔍 Monitoring & Analytics

### Email Tracking
- **Delivery Status**: Confirms email delivery
- **Open Tracking**: Monitors email opens
- **Click Tracking**: Tracks link clicks
- **Error Logging**: Records delivery failures

### Database Queries
```sql
-- View feedback email statistics
SELECT 
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) as avg_delivery_time
FROM feedback_emails 
GROUP BY status;

-- View feedback history for a session
SELECT 
    fe.candidate_name,
    fe.candidate_email,
    fe.email_subject,
    fe.status,
    fe.sent_at
FROM feedback_emails fe
WHERE fe.analysis_session_id = 'your-session-id'
ORDER BY fe.sent_at DESC;
```

## 🚨 Error Handling

### Common Issues & Solutions

#### Email Delivery Failures
- **Invalid Email Addresses**: Validate email format before sending
- **Spam Filters**: Use proper email authentication
- **Rate Limiting**: Implement sending delays for bulk operations
- **Provider Limits**: Monitor SendGrid/SMTP quotas

#### AI Generation Failures
- **API Limits**: Monitor OpenAI usage and limits
- **Content Filtering**: Handle inappropriate content generation
- **Fallback System**: Use default templates when AI fails
- **Error Logging**: Track and monitor generation errors

#### Database Issues
- **Connection Timeouts**: Implement proper connection pooling
- **Transaction Failures**: Use proper rollback mechanisms
- **Data Validation**: Validate all input data
- **Index Optimization**: Ensure proper database indexing

## 🔒 Security Considerations

### Data Protection
- **Email Privacy**: Protect candidate email addresses
- **Content Security**: Sanitize all email content
- **Access Control**: Restrict feedback sending to authorized users
- **Audit Logging**: Track all feedback email activities

### Compliance
- **GDPR Compliance**: Handle personal data appropriately
- **Email Regulations**: Follow CAN-SPAM and similar regulations
- **Data Retention**: Implement proper data retention policies
- **Consent Management**: Ensure proper consent for email communications

## 🚀 Future Enhancements

### Planned Features
- **Email Templates**: Multiple template options
- **Scheduling**: Schedule feedback emails for later sending
- **Analytics Dashboard**: Comprehensive email analytics
- **A/B Testing**: Test different feedback approaches
- **Integration**: Connect with CRM systems
- **Mobile App**: Mobile feedback management

### Technical Improvements
- **Queue System**: Implement email queuing for better performance
- **Caching**: Cache frequently used data
- **CDN**: Use CDN for email template assets
- **Monitoring**: Advanced monitoring and alerting
- **Testing**: Comprehensive test coverage

## 📞 Support

### Troubleshooting
1. **Check Environment Variables**: Ensure all required variables are set
2. **Verify Database**: Confirm feedback_emails table exists
3. **Test Email Provider**: Verify SendGrid/SMTP configuration
4. **Check Logs**: Review application logs for errors
5. **Validate API Keys**: Ensure OpenAI and email provider keys are valid

### Contact Information
- **Technical Support**: [Your support email]
- **Documentation**: [Your documentation URL]
- **Issue Tracking**: [Your issue tracker URL]

---

## 📋 Quick Start Checklist

- [ ] Run database migration script
- [ ] Configure environment variables
- [ ] Set up email provider (SendGrid/SMTP)
- [ ] Install required dependencies
- [ ] Test individual feedback sending
- [ ] Test bulk feedback sending
- [ ] Verify email delivery and tracking
- [ ] Review email templates and branding
- [ ] Set up monitoring and logging
- [ ] Train team on new functionality

The Feedback Email feature is now ready to enhance your recruitment process with professional, personalized candidate communication! 🎉
