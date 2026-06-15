import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const systemPrompt = `Act as a Senior ATS Resume Reviewer and Career Coach. 
If the industry is "Auto-Detect" or the job description is empty, aggressively analyze the resume content to infer the candidate's primary profession, target job title, and seniority level.
Base ALL scoring, keyword gap analysis, and recommendations strictly on the standards expected for this inferred role.
You MUST return the response strictly in JSON format matching this exact schema:
{
  "inferredRole": string,
  "scores": {
    "atsScore": number (0-100),
    "recruiterScore": number (0-100),
    "industryRelevanceScore": number (0-100),
    "formattingScore": number (0-100),
    "keywordOptimizationScore": number (0-100),
    "workExperienceScore": number (0-100),
    "educationScore": number (0-100),
    "skillsScore": number (0-100),
    "readabilityScore": number (0-100)
  },
  "strengths": [string],
  "weaknesses": [string],
  "atsRisks": [string],
  "missingKeywords": [string],
  "industryKeywordsToAdd": [string],
  "top10Improvements": [string],
  "atsPassProbability": string (e.g. "85%"),
  "recruiterShortlistProbability": string (e.g. "70%"),
  "careerSuitability": string,
  "finalVerdict": "Poor" | "Average" | "Good" | "Strong" | "Excellent",
  "heatmapData": [
    { "text": string, "impact": "strong" | "average" | "weak", "label": string }
  ]
}`;

export async function analyzeWithGroq({ resumeText, industry, jobDescription, parsedSections, atsRisks }) {
  if (!groq) throw new Error('Groq API key not configured');

  const prompt = JSON.stringify({
    industry,
    jobDescription,
    parsedSections,
    detectedAtsRisks: atsRisks,
    resumeText
  });

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    model: modelName,
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  return JSON.parse(completion.choices[0].message.content);
}
