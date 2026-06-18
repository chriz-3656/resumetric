import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

const systemPrompt = `Act as an elite Executive Career Coach and Professional Copywriter.
Generate a highly targeted, persuasive cover letter based on the provided resume text, industry, and job description.
The cover letter must:
1. Have a strong, engaging opening hook.
2. Directly address the keyword gaps and strengths identified in the ATS analysis.
3. Be formatted with professional spacing (paragraphs).
4. Use a confident, results-oriented tone (avoid passive language or cliches like "I am writing to apply").
5. Do NOT include placeholder brackets like [Your Name] or [Company Name] if the information is missing; instead, write around it smoothly.

Return ONLY the raw text of the cover letter. Do not include markdown formatting like \`\`\` or introductory text.`;

export async function generateCoverLetter({ resumeText, industry, jobDescription, analysis }) {
  if (!genAI) throw new Error('Google Gemini API key is not configured for cover letter generation.');

  const model = genAI.getGenerativeModel({ model: modelName });
  
  const prompt = `
    Context:
    Target Industry: ${industry}
    Target Role / Job Description: ${jobDescription || 'Standard application for this industry.'}
    
    Candidate ATS Profile:
    Strengths: ${analysis.strengths?.join(', ')}
    Weaknesses to compensate for: ${analysis.weaknesses?.join(', ')}
    
    Candidate Resume Text:
    ${resumeText}
    
    Write the cover letter now:
  `;

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: prompt }
  ]);

  return { coverLetter: result.response.text().trim() };
}
