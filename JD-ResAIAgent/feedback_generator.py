"""
LLM-powered Feedback Generation Service
Generates personalized, constructive feedback for candidates
"""

import os
import asyncio
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.schema.output_parser import StrOutputParser
from langchain.chains import LLMChain
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeedbackRequest(BaseModel):
    """Request model for feedback generation"""
    candidate_name: str
    resume_content: str
    analysis_results: Dict
    job_description: str
    job_title: Optional[str] = None
    company_name: str = "Innomatics Research Lab"

class FeedbackResponse(BaseModel):
    """Response model for generated feedback"""
    feedback_content: str
    subject_suggestion: str
    tone: str  # constructive, encouraging, professional
    key_areas: List[str]  # Areas of improvement identified

class FeedbackGenerator:
    """LLM-powered feedback generator for candidates"""
    
    def __init__(self, llm_model: str = "gpt-3.5-turbo"):
        self.llm = ChatOpenAI(
            model=llm_model,
            temperature=0.7,
            max_tokens=1000
        )
        self.prompt_template = self._create_prompt_template()
        self.chain = self.prompt_template | self.llm | StrOutputParser()
    
    def _create_prompt_template(self) -> PromptTemplate:
        """Create the prompt template for feedback generation"""
        
        template = """
You are a senior technical mentor and career advisor from Innomatics Research Lab, a leading research and development organization. Your role is to provide constructive, encouraging, and professional feedback to candidates who have applied for positions.

Your feedback should be:
1. **Constructive and Specific**: Point out specific areas for improvement with actionable advice
2. **Encouraging**: Maintain a positive, supportive tone that motivates the candidate
3. **Professional**: Use formal but warm language appropriate for a research lab
4. **Educational**: Help the candidate understand industry expectations and best practices
5. **Personalized**: Reference specific aspects of their resume and analysis

**Candidate Information:**
- Name: {candidate_name}
- Company: {company_name}
- Job Title: {job_title}

**Resume Analysis Results:**
- Overall Fit Score: {overall_fit}/100
- Skill Match Score: {skill_match}/100
- Project Relevance Score: {project_relevance}/100
- Problem Solving Score: {problem_solving}/100
- Tools & Technology Score: {tools_score}/100
- AI Summary: {ai_summary}

**Job Description:**
{job_description}

**Resume Content (Key Sections):**
{resume_content}

**Instructions:**
Generate a comprehensive feedback email that:

1. **Acknowledges their application** and thanks them for their interest
2. **Highlights their strengths** based on the analysis
3. **Provides specific improvement suggestions** in 3-4 key areas:
   - Technical skills development
   - Project experience enhancement
   - Resume presentation and formatting
   - Industry knowledge and trends
4. **Offers encouragement** and next steps for career development
5. **Maintains professional tone** from Innomatics Research Lab

**Format your response as:**
FEEDBACK:
[Your detailed feedback content here - 4-6 paragraphs]

SUBJECT:
[Suggested email subject line]

TONE:
[constructive/encouraging/professional]

KEY_AREAS:
[Comma-separated list of 3-4 key improvement areas]

Remember: Be specific, actionable, and encouraging. Help them grow professionally while maintaining the prestige and professionalism of Innomatics Research Lab.
        """
        
        return PromptTemplate(
            input_variables=[
                "candidate_name", "company_name", "job_title",
                "overall_fit", "skill_match", "project_relevance", 
                "problem_solving", "tools_score", "ai_summary",
                "job_description", "resume_content"
            ],
            template=template
        )
    
    async def generate_feedback(self, request: FeedbackRequest) -> FeedbackResponse:
        """Generate personalized feedback for a candidate"""
        
        try:
            # Extract analysis results
            analysis = request.analysis_results
            overall_fit = analysis.get("Overall Fit", 70)
            skill_match = analysis.get("Skill Match", 70)
            project_relevance = analysis.get("Project Relevance", 70)
            problem_solving = analysis.get("Problem Solving", 70)
            tools_score = analysis.get("Tools", 70)
            ai_summary = analysis.get("Summary", "Analysis completed")
            
            # Truncate resume content if too long
            resume_content = request.resume_content[:2000] + "..." if len(request.resume_content) > 2000 else request.resume_content
            
            # Generate feedback using LLM
            response = await asyncio.to_thread(
                self.chain.invoke,
                {
                    "candidate_name": request.candidate_name,
                    "company_name": request.company_name,
                    "job_title": request.job_title or "the position",
                    "overall_fit": overall_fit,
                    "skill_match": skill_match,
                    "project_relevance": project_relevance,
                    "problem_solving": problem_solving,
                    "tools_score": tools_score,
                    "ai_summary": ai_summary,
                    "job_description": request.job_description[:1000] + "..." if len(request.job_description) > 1000 else request.job_description,
                    "resume_content": resume_content
                }
            )
            
            # Parse the response
            return self._parse_response(response)
            
        except Exception as e:
            logger.error(f"Error generating feedback: {str(e)}")
            # Return fallback feedback
            return self._generate_fallback_feedback(request)
    
    def _parse_response(self, response: str) -> FeedbackResponse:
        """Parse the LLM response into structured format"""
        
        try:
            lines = response.strip().split('\n')
            feedback_content = ""
            subject_suggestion = ""
            tone = "constructive"
            key_areas = []
            
            current_section = None
            
            for line in lines:
                line = line.strip()
                
                if line.startswith("FEEDBACK:"):
                    current_section = "feedback"
                    feedback_content = line.replace("FEEDBACK:", "").strip()
                elif line.startswith("SUBJECT:"):
                    current_section = "subject"
                    subject_suggestion = line.replace("SUBJECT:", "").strip()
                elif line.startswith("TONE:"):
                    current_section = "tone"
                    tone = line.replace("TONE:", "").strip().lower()
                elif line.startswith("KEY_AREAS:"):
                    current_section = "key_areas"
                    areas_str = line.replace("KEY_AREAS:", "").strip()
                    key_areas = [area.strip() for area in areas_str.split(',') if area.strip()]
                elif current_section == "feedback" and line:
                    feedback_content += "\n" + line
                elif current_section == "subject" and line:
                    subject_suggestion += " " + line
            
            # Clean up feedback content
            feedback_content = feedback_content.strip()
            if not feedback_content:
                feedback_content = "Thank you for your application. We appreciate your interest in our opportunities."
            
            # Ensure we have a subject
            if not subject_suggestion:
                subject_suggestion = "Feedback on Your Application - Innomatics Research Lab"
            
            # Ensure we have key areas
            if not key_areas:
                key_areas = ["Technical Skills", "Project Experience", "Resume Presentation"]
            
            return FeedbackResponse(
                feedback_content=feedback_content,
                subject_suggestion=subject_suggestion,
                tone=tone,
                key_areas=key_areas
            )
            
        except Exception as e:
            logger.error(f"Error parsing LLM response: {str(e)}")
            return self._generate_fallback_response()
    
    def _generate_fallback_feedback(self, request: FeedbackRequest) -> FeedbackResponse:
        """Generate fallback feedback when LLM fails"""
        
        analysis = request.analysis_results
        overall_fit = analysis.get("Overall Fit", 70)
        
        if overall_fit >= 80:
            feedback_content = f"""
Dear {request.candidate_name},

Thank you for your application to Innomatics Research Lab. We were impressed by your qualifications and the effort you put into your application.

Your resume demonstrates strong technical skills and relevant experience. We particularly noted your attention to detail and the comprehensive nature of your project descriptions.

To further strengthen your candidacy for future opportunities, we recommend:

1. **Technical Skills Enhancement**: Consider expanding your knowledge in emerging technologies and industry best practices. Online courses and certifications can be valuable additions.

2. **Project Documentation**: While your projects are well-described, consider adding more quantitative results and impact metrics to demonstrate the value you've delivered.

3. **Industry Engagement**: Stay updated with the latest trends in your field through professional networks, conferences, and industry publications.

4. **Continuous Learning**: The technology landscape evolves rapidly. Consider setting up a learning plan to stay current with new tools and methodologies.

We encourage you to continue developing your skills and exploring opportunities in the technology sector. Your dedication to professional growth is commendable.

Best regards,
Innomatics Research Lab Team
            """
        elif overall_fit >= 60:
            feedback_content = f"""
Dear {request.candidate_name},

Thank you for your interest in opportunities at Innomatics Research Lab. We appreciate the time and effort you invested in your application.

Your resume shows potential and demonstrates your commitment to professional development. We can see areas where you're building valuable skills and experience.

To help you strengthen your candidacy for future opportunities, we suggest focusing on:

1. **Technical Skills Development**: Consider deepening your expertise in core technologies relevant to your target roles. Hands-on projects and practical experience are highly valued.

2. **Project Experience**: Look for opportunities to work on more complex projects that demonstrate problem-solving abilities and technical depth.

3. **Resume Optimization**: Ensure your resume clearly highlights your achievements with specific examples and quantifiable results where possible.

4. **Professional Development**: Consider pursuing relevant certifications or additional training in areas that align with your career goals.

The technology field offers many opportunities for growth, and we encourage you to continue building your skills and experience.

Best regards,
Innomatics Research Lab Team
            """
        else:
            feedback_content = f"""
Dear {request.candidate_name},

Thank you for your application to Innomatics Research Lab. We appreciate your interest in our opportunities and the effort you put into your submission.

We believe that every application is a learning opportunity, and we'd like to provide some guidance that may help you in your career development:

1. **Foundation Building**: Focus on strengthening your core technical skills through structured learning programs and hands-on practice.

2. **Project Portfolio**: Develop a portfolio of projects that demonstrate your abilities and show progression in your skills over time.

3. **Industry Knowledge**: Stay informed about current trends and technologies in your field of interest through reading, online courses, and professional communities.

4. **Professional Presentation**: Ensure your resume and application materials are polished, error-free, and clearly communicate your value proposition.

Remember that career development is a journey, and every step forward is valuable. We encourage you to continue learning and growing in your chosen field.

Best regards,
Innomatics Research Lab Team
            """
        
        return FeedbackResponse(
            feedback_content=feedback_content.strip(),
            subject_suggestion=f"Feedback on Your Application - {request.job_title or 'Position'}",
            tone="constructive",
            key_areas=["Technical Skills", "Project Experience", "Professional Development", "Industry Knowledge"]
        )
    
    def _generate_fallback_response(self) -> FeedbackResponse:
        """Generate a basic fallback response"""
        
        return FeedbackResponse(
            feedback_content="""
Thank you for your application to Innomatics Research Lab. We appreciate your interest in our opportunities.

We encourage you to continue developing your skills and exploring opportunities in the technology sector. Consider focusing on technical skill development, project experience, and professional networking.

Best regards,
Innomatics Research Lab Team
            """.strip(),
            subject_suggestion="Feedback on Your Application - Innomatics Research Lab",
            tone="constructive",
            key_areas=["Technical Skills", "Project Experience", "Professional Development"]
        )

# Global feedback generator instance
_feedback_generator: Optional[FeedbackGenerator] = None

def get_feedback_generator() -> FeedbackGenerator:
    """Get the global feedback generator instance"""
    global _feedback_generator
    
    if _feedback_generator is None:
        model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        _feedback_generator = FeedbackGenerator(model)
    
    return _feedback_generator

async def generate_candidate_feedback(
    candidate_name: str,
    resume_content: str,
    analysis_results: Dict,
    job_description: str,
    job_title: Optional[str] = None
) -> FeedbackResponse:
    """Convenience function to generate feedback for a candidate"""
    
    request = FeedbackRequest(
        candidate_name=candidate_name,
        resume_content=resume_content,
        analysis_results=analysis_results,
        job_description=job_description,
        job_title=job_title
    )
    
    generator = get_feedback_generator()
    return await generator.generate_feedback(request)
