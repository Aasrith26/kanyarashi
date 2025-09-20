# RecurAI Setup Guide

## 🚀 Complete Setup Instructions

### 1. PostgreSQL Database Setup

#### Windows:
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. Open pgAdmin or use command line to create the database

#### macOS:
```bash
# Install using Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb recur_ai_db
```

#### Linux (Ubuntu):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb recur_ai_db
```

#### Database Initialization:
```bash
# Navigate to your project directory
cd your-project-directory

# Run the database setup
psql -U postgres -d recur_ai_db -f database/init.sql
```

### 2. Environment Variables Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://recur_ai_app:app_password_123@localhost:5432/recur_ai_db

# AWS S3 Configuration
S3_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY=your-aws-access-key
AWS_SECRET_KEY=your-aws-secret-key
AWS_REGION=ap-south-1

# AI/LLM Configuration
OPENROUTER_API_KEY=your-openrouter-api-key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# S3 Frontend Configuration
NEXT_PUBLIC_S3_BUCKET_NAME=your-s3-bucket-name
NEXT_PUBLIC_S3_ACCESS_KEY_ID=your-aws-access-key
NEXT_PUBLIC_S3_SECRET_ACCESS_KEY_ID=your-aws-secret-key
```

### 3. Backend Setup (JD-ResAIAgent)

```bash
# Navigate to backend directory
cd JD-ResAIAgent

# Create virtual environment
python -m venv resAI
# On Windows: resAI\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the enhanced backend
python main_enhanced.py
```

The backend will be available at `http://localhost:8000`

### 4. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 5. AWS S3 Setup

1. Create an S3 bucket in AWS Console
2. Configure bucket permissions for public read access
3. Create IAM user with S3 access
4. Add credentials to your `.env` file

### 6. Clerk Authentication Setup

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the API keys to your `.env` file
4. Configure sign-in/sign-up URLs

### 7. OpenRouter API Setup

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get your API key
3. Add to your `.env` file

## 🎯 Key Features Implemented

### ✅ Database Integration
- PostgreSQL with comprehensive schema
- User management
- Job posting management
- Resume tracking
- Analysis session management
- Detailed scoring and ranking

### ✅ Enhanced UI/UX
- Modern, clean design with blue/indigo gradient theme
- Responsive layout
- Professional dashboard
- Real-time analysis progress
- Interactive candidate cards
- Export and sharing capabilities

### ✅ Backend API
- RESTful API with FastAPI
- Async processing
- File upload handling
- AI-powered analysis
- Session management
- Error handling

### ✅ AI Features
- Semantic resume matching
- Multi-dimensional scoring
- LLM-powered explanations
- Concurrent processing
- Vector similarity search

## 🔧 Usage Workflow

1. **Sign Up/Login**: Users authenticate via Clerk
2. **Create Job Posting**: Define job requirements
3. **Upload Resumes**: Bulk upload candidate resumes
4. **Start Analysis**: AI processes and ranks candidates
5. **View Results**: Detailed scoring with explanations
6. **Export/Share**: Download or share results

## 🚨 Troubleshooting

### Database Connection Issues:
- Ensure PostgreSQL is running
- Check database credentials
- Verify database exists

### S3 Upload Issues:
- Verify AWS credentials
- Check bucket permissions
- Ensure bucket exists

### AI Analysis Issues:
- Verify OpenRouter API key
- Check internet connection
- Monitor API rate limits

### Frontend Issues:
- Clear browser cache
- Check environment variables
- Verify Clerk configuration

## 📊 Performance Optimization

- Database indexes for fast queries
- Async processing for scalability
- Vector caching for repeated analyses
- Responsive UI for all devices

## 🔒 Security Features

- User authentication via Clerk
- Database connection security
- S3 secure file storage
- API rate limiting
- Input validation

## 🎨 Design System

- **Colors**: Blue/Indigo gradient theme
- **Typography**: Clean, readable fonts
- **Components**: Consistent UI elements
- **Layout**: Responsive grid system
- **Animations**: Smooth transitions

Your RecurAI system is now ready for production use! 🎉
