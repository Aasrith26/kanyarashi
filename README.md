# RecurAI - Intelligent Resume Analysis Platform

![RecurAI Logo](https://img.shields.io/badge/RecurAI-Resume%20Analysis-blue?style=for-the-badge&logo=react)

A comprehensive AI-powered resume analysis platform that helps recruiters and HR professionals efficiently evaluate candidate resumes against job descriptions. Built with Next.js, FastAPI, and advanced AI technologies.

## 🚀 Features

### Core Functionality
- **Intelligent Resume Analysis**: AI-powered evaluation of resumes against job descriptions
- **Multi-format Support**: Handles PDF, DOC, and DOCX resume formats
- **Job-Specific Analysis**: Compare resumes against specific job postings
- **General Analysis**: Evaluate resumes without specific job context
- **Real-time Processing**: Fast analysis with progress tracking
- **Comprehensive Scoring**: Multi-dimensional evaluation metrics

### User Experience
- **Modern UI/UX**: Clean, responsive design with intuitive navigation
- **Drag & Drop Upload**: Easy file upload with visual feedback
- **Smart Resume Management**: Organize and track resume analysis history
- **Detailed Results**: Comprehensive analysis reports with actionable insights
- **Export Capabilities**: Download analysis results in multiple formats

### Technical Features
- **Cloud Storage**: Secure AWS S3 integration for file management
- **User Authentication**: Secure login with Clerk authentication
- **Database Management**: PostgreSQL for reliable data persistence
- **API Integration**: RESTful API with comprehensive endpoints
- **Scalable Architecture**: Built for enterprise-level usage

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI for accessible components
- **Authentication**: Clerk for secure user management
- **State Management**: React hooks and context
- **File Handling**: React Dropzone for drag-and-drop uploads

### Backend (FastAPI)
- **Framework**: FastAPI with async support
- **AI Integration**: OpenRouter API with LangChain
- **File Processing**: Multi-format document parsing
- **Vector Search**: FAISS for semantic similarity
- **Database**: PostgreSQL with connection pooling
- **Cloud Storage**: AWS S3 for scalable file storage

### AI & ML Stack
- **Language Model**: Qwen 3-14B via OpenRouter
- **Embeddings**: HuggingFace sentence-transformers
- **Vector Database**: FAISS for similarity search
- **Text Processing**: LangChain for document analysis
- **Scoring Algorithm**: Multi-dimensional evaluation system

## 📊 Analysis Metrics

### Scoring Dimensions
1. **Overall Fit Score**: Comprehensive compatibility assessment
2. **Skill Match**: Technical skills alignment with job requirements
3. **Experience Relevance**: Work experience pertinence
4. **Education Match**: Educational background evaluation
5. **Tools & Technologies**: Proficiency in required tools
6. **Problem Solving**: Analytical and problem-solving capabilities

### AI-Powered Insights
- **Detailed Reasoning**: 5-6 sentence explanations for each candidate
- **Strengths & Weaknesses**: Comprehensive candidate assessment
- **Recommendation Score**: Overall hiring recommendation
- **Comparative Analysis**: Side-by-side candidate comparison

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- PostgreSQL 13+
- AWS S3 bucket
- OpenRouter API key
- Clerk authentication setup

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/Aasrith26/kanyarashi.git
cd kanyarashi

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd JD-ResAIAgent

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the backend server
python main_backend_s3.py
```

### Database Setup
```bash
# Create PostgreSQL database
createdb recur_ai_db

# Run database migrations
psql -d recur_ai_db -f database/schema.sql
psql -d recur_ai_db -f database/init.sql
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

#### Backend (.env)
```env
OPENROUTER_API_KEY=your_openrouter_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name
DATABASE_URL=postgresql://user:password@localhost:5432/recur_ai_db
```

## 🚀 Deployment

### Vercel Deployment (Frontend)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend Deployment
The backend can be deployed to:
- **Railway**: Easy PostgreSQL integration
- **Render**: Free tier available
- **AWS EC2**: Full control and scalability
- **DigitalOcean**: Cost-effective option

### Environment Variables for Production
Set these in your deployment platform:
- `OPENROUTER_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `DATABASE_URL`

## 📱 Usage Guide

### For Recruiters
1. **Sign Up/Login**: Create account with Clerk authentication
2. **Create Job Posting**: Add job description and requirements
3. **Upload Resumes**: Drag and drop or select existing resumes
4. **Run Analysis**: Choose between job-specific or general analysis
5. **Review Results**: Analyze detailed scoring and insights
6. **Export Reports**: Download comprehensive analysis reports

### For HR Teams
1. **Bulk Processing**: Upload multiple resumes simultaneously
2. **Comparative Analysis**: Compare candidates side-by-side
3. **Custom Scoring**: Adjust evaluation criteria as needed
4. **Team Collaboration**: Share analysis results with team members
5. **Historical Tracking**: Maintain analysis history and trends

## 🔌 API Documentation

### Core Endpoints

#### Job Postings
- `GET /job-postings/` - List all job postings
- `POST /job-postings/` - Create new job posting
- `GET /job-postings/{id}` - Get specific job posting
- `PUT /job-postings/{id}` - Update job posting
- `DELETE /job-postings/{id}` - Delete job posting

#### Resume Management
- `POST /resumes/upload` - Upload new resumes
- `GET /resumes/s3/` - List available resumes
- `POST /resumes/select` - Select resumes for analysis
- `POST /resumes/cleanup` - Clean up orphaned files

#### Analysis
- `POST /analysis-sessions/` - Start new analysis
- `GET /analysis-sessions/` - List analysis sessions
- `GET /analysis-sessions/{id}` - Get analysis results
- `DELETE /analysis-sessions/{id}` - Delete analysis
- `POST /analysis-sessions/{id}/reset` - Reset analysis

### Authentication
All endpoints require Clerk authentication. Include the user's Clerk ID in requests.

## 🧪 Testing

### Frontend Testing
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Backend Testing
```bash
# Run API tests
python -m pytest tests/

# Run with coverage
python -m pytest --cov=main_backend_s3 tests/
```

## 📈 Performance

### Optimization Features
- **Lazy Loading**: Components load on demand
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic bundle splitting
- **Caching**: Intelligent caching strategies
- **CDN**: Global content delivery network

### Scalability
- **Horizontal Scaling**: Stateless backend architecture
- **Database Optimization**: Indexed queries and connection pooling
- **File Storage**: Scalable AWS S3 integration
- **API Rate Limiting**: Built-in rate limiting and throttling

## 🔒 Security

### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **Authentication**: Secure JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries

### Privacy Compliance
- **GDPR Compliant**: European data protection standards
- **Data Retention**: Configurable data retention policies
- **User Consent**: Clear consent mechanisms
- **Data Portability**: Export user data capabilities

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write comprehensive tests
- Update documentation
- Ensure all tests pass
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for AI model access
- **Clerk** for authentication services
- **Vercel** for hosting and deployment
- **AWS** for cloud storage and services
- **HuggingFace** for embedding models
- **LangChain** for AI framework

## 📞 Support

For support and questions:
- **Email**: support@recur-ai.com
- **Documentation**: [docs.recur-ai.com](https://docs.recur-ai.com)
- **Issues**: [GitHub Issues](https://github.com/Aasrith26/kanyarashi/issues)

## 🗺️ Roadmap

### Upcoming Features
- [ ] Advanced filtering and search
- [ ] Team collaboration features
- [ ] Custom scoring templates
- [ ] Integration with ATS systems
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] API webhooks

### Version History
- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Enhanced UI/UX and performance improvements
- **v1.2.0** - Advanced analysis features and export capabilities

---

**Built with ❤️ by the RecurAI Team**

*Transforming recruitment through intelligent resume analysis*