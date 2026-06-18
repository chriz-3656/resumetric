import { GoogleGenerativeAI } from '@google/generative-ai';

const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const systemPrompt = `Act as a Senior ATS Resume Reviewer, HR Recruiter, Hiring Manager, and Career Coach.

If the industry is "Auto-Detect" or the job description is empty, aggressively analyze the resume content to infer the candidate's primary profession, target job title, and seniority level.
Base ALL scoring, keyword gap analysis, and recommendations strictly on the standards expected for this inferred role.

Analyze the provided resume content thoroughly.

Provide:
1. Inferred Role (string)
2. Overall ATS Score (0-100)
2. Recruiter Score (0-100)
3. Industry Relevance Score
4. Formatting Score
5. Keyword Optimization Score
6. Work Experience Score
7. Education Score
8. Skills Score
9. Readability Score

Generate strengths, weaknesses, ATS risks, missing keywords, weak keywords, overused keywords, and industry keywords to add.
Estimate ATS pass probability, recruiter shortlist probability, and career suitability.
Provide top 10 improvements, revised ATS score after improvements, and final verdict.
Verdict categories: Poor, Average, Good, Strong, Excellent.
Return response strictly in structured JSON format with camelCase keys. 
Include a 'heatmapData' key which is an array of objects: { "text": string, "impact": "strong" | "average" | "weak", "label": string }. 
These segments should map directly to parts of the resumeText to visually highlight performance.`;

export async function analyzeResume({ resumeText, industry, jobDescription, parsedSections, atsRisks, fallback }) {
  if (!genAI) return fallbackAnalysis(fallback, atsRisks);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.25 }
  });

  const prompt = JSON.stringify({
    industry,
    jobDescription,
    parsedSections,
    detectedAtsRisks: atsRisks,
    heuristicScores: fallback,
    resumeText
  });

  try {
    const response = await model.generateContent(prompt);
    const parsed = JSON.parse(response.response.text());
    return normalizeAnalysis(parsed, fallback, atsRisks);
  } catch (error) {
    return fallbackAnalysis(fallback, atsRisks, error.message);
  }
}

export async function rewriteResume({ resumeText, industry, targetRole, jobDescription }) {
  if (!genAI) {
    return {
      rewrittenSummary: 'Add GEMINI_API_KEY to generate AI rewrites.',
      bulletImprovements: [],
      optimizedSkills: [],
      rewrittenResume: resumeText
    };
  }
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.35 }
  });
  const prompt = `Rewrite this resume for ATS compatibility and recruiter clarity. Return JSON with rewrittenSummary, bulletImprovements, optimizedSkills, rewrittenResume, and rewriteNotes.
Industry: ${industry}
Target role: ${targetRole}
Job description: ${jobDescription}
Resume:
${resumeText}`;
  const response = await model.generateContent(prompt);
  return JSON.parse(response.response.text());
}

function normalizeAnalysis(data, fallback, atsRisks) {
  return {
    ...fallbackAnalysis(fallback, atsRisks),
    ...data,
    scores: {
      ...fallbackAnalysis(fallback, atsRisks).scores,
      ...(data.scores || data)
    }
  };
}

function fallbackAnalysis(fallback, atsRisks, aiError = '') {
  return {
    inferredRole: 'Auto-Detected Role (Fallback)',
    scores: {
      atsScore: fallback.atsScore,
      recruiterScore: fallback.recruiterScore,
      industryRelevanceScore: fallback.industryRelevanceScore,
      formattingScore: fallback.formattingScore,
      keywordOptimizationScore: fallback.keywordOptimizationScore,
      workExperienceScore: fallback.workExperienceScore,
      educationScore: fallback.educationScore,
      skillsScore: fallback.skillsScore,
      readabilityScore: fallback.readabilityScore,
      matchScore: fallback.matchScore
    },
    strengths: ['Resume text was parsed successfully.', 'Core sections and keyword coverage were evaluated.'],
    weaknesses: fallback.missingKeywords.length ? ['Keyword coverage can be improved for the selected target.'] : [],
    atsRisks,
    missingSections: atsRisks.filter((risk) => risk.type.startsWith('Missing')).map((risk) => risk.type),
    missingKeywords: fallback.missingKeywords,
    matchedKeywords: fallback.matchedKeywords,
    weakKeywords: fallback.missingKeywords.slice(0, 8),
    overusedKeywords: [],
    industryKeywordsToAdd: fallback.missingKeywords.slice(0, 12),
    skillGapAnalysis: fallback.missingKeywords.slice(0, 10),
    experienceGapAnalysis: ['Quantify impact with metrics, scope, tools, and business outcomes where possible.'],
    professionalRecommendations: [
      'Use a simple one-column layout with standard headings.',
      'Add role-specific keywords naturally in summary, skills, and experience bullets.',
      'Rewrite bullets with action, scope, measurable result, and tools used.'
    ],
    top10Improvements: [
      'Add a targeted professional summary.',
      'Include measurable achievements in recent roles.',
      'Add missing target-role keywords.',
      'Keep formatting ATS-friendly and single column.',
      'Separate technical and soft skills.',
      'Add relevant certifications.',
      'Align project descriptions with the target job.',
      'Use consistent dates and job titles.',
      'Remove graphics, icons, tables, and text boxes.',
      'Prioritize recent and relevant experience.'
    ],
    atsPassProbability: `${Math.max(10, fallback.atsScore - 8)}%`,
    recruiterShortlistProbability: `${Math.max(10, fallback.recruiterScore - 12)}%`,
    careerSuitability: fallback.atsScore >= 75 ? 'Strong fit with optimization opportunities.' : 'Potential fit; needs targeted improvements.',
    revisedAtsScoreAfterImprovements: Math.min(96, fallback.atsScore + 18),
    finalVerdict: verdict(fallback.atsScore),
    heatmapData: [
      { text: "Contact Information", impact: fallback.atsScore > 50 ? "strong" : "average", label: "Contact module detected" },
      { text: "Professional Summary", impact: fallback.atsScore > 60 ? "strong" : "weak", label: "Semantic summary scan" },
      { text: "Experience History", impact: fallback.atsScore > 70 ? "strong" : "average", label: "Chronological depth" },
      { text: "Technical Skills", impact: fallback.atsScore > 65 ? "strong" : "average", label: "Keyword alignment" }
    ],
    aiStatus: aiError ? `Fallback heuristic analysis used: ${aiError}` : 'Fallback heuristic analysis used because GEMINI_API_KEY is not configured.'
  };
}

function verdict(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 78) return 'Strong';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Average';
  return 'Poor';
}
