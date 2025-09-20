# RecurAI Backend API Testing Guide

## 🚀 Setup Instructions

### 1. Import the Collection
1. Open Postman
2. Click "Import" button
3. Copy the collection JSON below and paste it
4. Save the collection as "RecurAI Backend API"

### 2. Environment Variables
Create a new environment in Postman with these variables:
```
base_url: http://localhost:8000
clerk_id: your_clerk_user_id_here
```

---

## 📋 API Endpoints Testing Guide

### 🔍 **Health Check & Status**

#### 1. Root Endpoint
- **Method**: `GET`
- **URL**: `{{base_url}}/`
- **Description**: Check if the API is running
- **Expected Response**:
```json
{
  "status": "ok",
  "message": "RecurAI Backend is running!",
  "version": "1.0.0",
  "database": "Connected ✅"
}
```

#### 2. Health Check
- **Method**: `GET`
- **URL**: `{{base_url}}/health`
- **Description**: Check database connectivity
- **Expected Response**:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

### 👤 **User Management**

#### 3. Create User
- **Method**: `POST`
- **URL**: `{{base_url}}/users/`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "clerk_id": "{{clerk_id}}",
  "email": "test@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Test Company"
}
```
- **Expected Response**:
```json
{
  "message": "User created successfully",
  "user_id": "uuid-here"
}
```

#### 4. Get User
- **Method**: `GET`
- **URL**: `{{base_url}}/users/{{clerk_id}}`
- **Expected Response**:
```json
{
  "id": "uuid-here",
  "clerk_id": "user_clerk_id",
  "email": "test@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Test Company",
  "created_at": "2024-01-15T10:30:00"
}
```

---

### 💼 **Job Posting Management**

#### 5. Create Job Posting
- **Method**: `POST`
- **URL**: `{{base_url}}/job-postings/?clerk_id={{clerk_id}}`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "title": "Senior Frontend Developer",
  "description": "We are looking for an experienced frontend developer to join our team. You will be responsible for building user interfaces and ensuring great user experience.",
  "requirements": "5+ years React experience, TypeScript, CSS/SCSS, Git",
  "location": "Remote",
  "salary_range": "$80,000 - $120,000",
  "employment_type": "Full-time",
  "experience_level": "Senior"
}
```
- **Expected Response**:
```json
{
  "message": "Job posting created successfully",
  "job_id": "uuid-here"
}
```

#### 6. Get All Job Postings
- **Method**: `GET`
- **URL**: `{{base_url}}/job-postings/?clerk_id={{clerk_id}}`
- **Expected Response**:
```json
[
  {
    "id": "uuid-here",
    "title": "Senior Frontend Developer",
    "description": "We are looking for...",
    "location": "Remote",
    "status": "active",
    "created_at": "2024-01-15T10:30:00"
  }
]
```

#### 7. Get Specific Job Posting
- **Method**: `GET`
- **URL**: `{{base_url}}/job-postings/{job_id}`
- **Replace `{job_id}` with actual job ID from step 5**
- **Expected Response**:
```json
{
  "id": "uuid-here",
  "title": "Senior Frontend Developer",
  "description": "We are looking for...",
  "requirements": "5+ years React experience...",
  "location": "Remote",
  "salary_range": "$80,000 - $120,000",
  "employment_type": "Full-time",
  "experience_level": "Senior",
  "status": "active",
  "created_at": "2024-01-15T10:30:00"
}
```

---

### 📄 **Resume Management**

#### 8. Upload Resume
- **Method**: `POST`
- **URL**: `{{base_url}}/resumes/upload`
- **Headers**: `Content-Type: multipart/form-data`
- **Body** (form-data):
```
file: [Select a PDF/DOC/DOCX file]
clerk_id: {{clerk_id}}
job_posting_id: [Optional - job ID from step 5]
```
- **Expected Response**:
```json
{
  "message": "Resume uploaded successfully",
  "resume_id": "uuid-here",
  "filename": "resume.pdf",
  "size": 1024000
}
```

#### 9. Get All Resumes
- **Method**: `GET`
- **URL**: `{{base_url}}/resumes/?clerk_id={{clerk_id}}`
- **Expected Response**:
```json
[
  {
    "id": "uuid-here",
    "filename": "resume.pdf",
    "file_type": "application/pdf",
    "file_size": 1024000,
    "created_at": "2024-01-15T10:30:00"
  }
]
```

#### 10. Get Resumes for Specific Job
- **Method**: `GET`
- **URL**: `{{base_url}}/resumes/?clerk_id={{clerk_id}}&job_posting_id={job_id}`
- **Replace `{job_id}` with actual job ID**
- **Expected Response**: Same as step 9, but filtered by job

---

### 🔬 **Analysis Management**

#### 11. Create Analysis Session
- **Method**: `POST`
- **URL**: `{{base_url}}/analysis-sessions/`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "job_posting_id": "job_id_from_step_5",
  "resume_ids": ["resume_id_1", "resume_id_2"],
  "clerk_id": "{{clerk_id}}"
}
```
- **Expected Response**:
```json
{
  "message": "Analysis session created successfully",
  "session_id": "uuid-here",
  "status": "pending",
  "total_resumes": 2
}
```

#### 12. Get All Analysis Sessions
- **Method**: `GET`
- **URL**: `{{base_url}}/analysis-sessions/?clerk_id={{clerk_id}}`
- **Expected Response**:
```json
[
  {
    "id": "uuid-here",
    "name": "Analysis 2024-01-15 10:30",
    "status": "completed",
    "total_resumes": 2,
    "processed_resumes": 2,
    "created_at": "2024-01-15T10:30:00",
    "completed_at": "2024-01-15T10:35:00",
    "job_title": "Senior Frontend Developer"
  }
]
```

#### 13. Get Analysis Session Results
- **Method**: `GET`
- **URL**: `{{base_url}}/analysis-sessions/{session_id}`
- **Replace `{session_id}` with actual session ID from step 11**
- **Expected Response**:
```json
{
  "session": {
    "id": "uuid-here",
    "name": "Analysis 2024-01-15 10:30",
    "status": "completed",
    "total_resumes": 2,
    "processed_resumes": 2,
    "created_at": "2024-01-15T10:30:00",
    "completed_at": "2024-01-15T10:35:00",
    "job_title": "Senior Frontend Developer"
  },
  "results": [
    {
      "id": "uuid-here",
      "resume_id": "uuid-here",
      "overall_score": 85.5,
      "skill_match_score": 90.0,
      "experience_score": 80.0,
      "education_score": 85.0,
      "summary": "Strong candidate with relevant experience...",
      "created_at": "2024-01-15T10:35:00"
    }
  ]
}
```

---

## 🧪 **Testing Workflow**

### Complete End-to-End Test:

1. **Setup**: Test health endpoints (1-2)
2. **User**: Create and verify user (3-4)
3. **Job**: Create job posting (5)
4. **Resume**: Upload multiple resumes (8)
5. **Analysis**: Create analysis session (11)
6. **Results**: Check analysis results (12-13)

### Error Testing:

#### Test Invalid Clerk ID:
- Use `clerk_id: invalid_id` in any endpoint
- Expected: 404 "User not found"

#### Test Invalid Job ID:
- Use non-existent job ID in analysis creation
- Expected: 500 "Error creating analysis session"

#### Test File Upload Without File:
- Send POST to `/resumes/upload` without file
- Expected: 422 "Validation Error"

---

## 📊 **Expected Status Codes**

- **200**: Success
- **201**: Created (for POST requests)
- **404**: Not Found (invalid IDs)
- **422**: Validation Error (missing required fields)
- **500**: Internal Server Error (database issues)

---

## 🔧 **Troubleshooting**

### Common Issues:

1. **Connection Refused**: Make sure backend is running on port 8000
2. **Database Error**: Check PostgreSQL is running and accessible
3. **File Upload Fails**: Ensure file is valid PDF/DOC/DOCX format
4. **CORS Error**: Check frontend is running on localhost:3000

### Debug Steps:

1. Check backend logs for error messages
2. Verify database connection with health endpoint
3. Test with simple GET requests first
4. Check file size limits (default: 10MB)

---

## 📝 **Postman Collection JSON**

```json
{
  "info": {
    "name": "RecurAI Backend API",
    "description": "Complete API testing collection for RecurAI backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    },
    {
      "key": "clerk_id",
      "value": "your_clerk_user_id_here"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "item": [
        {
          "name": "Root Endpoint",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/",
              "host": ["{{base_url}}"],
              "path": [""]
            }
          }
        },
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/health",
              "host": ["{{base_url}}"],
              "path": ["health"]
            }
          }
        }
      ]
    },
    {
      "name": "User Management",
      "item": [
        {
          "name": "Create User",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"clerk_id\": \"{{clerk_id}}\",\n  \"email\": \"test@example.com\",\n  \"first_name\": \"John\",\n  \"last_name\": \"Doe\",\n  \"company_name\": \"Test Company\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/users/",
              "host": ["{{base_url}}"],
              "path": ["users", ""]
            }
          }
        },
        {
          "name": "Get User",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/users/{{clerk_id}}",
              "host": ["{{base_url}}"],
              "path": ["users", "{{clerk_id}}"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## ✅ **Success Criteria**

Your API is working correctly if:

1. ✅ Health endpoints return 200 OK
2. ✅ User creation returns 200 with user_id
3. ✅ Job posting creation returns 200 with job_id
4. ✅ Resume upload returns 200 with resume_id
5. ✅ Analysis session creation returns 200 with session_id
6. ✅ All GET endpoints return proper data structures
7. ✅ Error handling works for invalid inputs

---

**Happy Testing! 🚀**

For any issues, check the backend logs and ensure all services are running properly.
