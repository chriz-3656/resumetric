import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const systemPrompt = `Act as an elite Executive Career Coach and Professional Copywriter.
Generate a highly targeted, persuasive cover letter based on the provided resume text, industry, and job description.
The cover letter must:
1. Have a strong, engaging opening hook.
2. Directly address the keyword gaps and strengths identified in the ATS analysis.
3. Be formatted with professional spacing (paragraphs).
4. Use a confident, results-oriented tone (avoid passive language or cliches like "I am writing to apply").
5. Do NOT include placeholder brackets like [Your Name] or [Company Name] if the information is missing; instead, write around it smoothly.

Return your response strictly in JSON format matching this exact schema:
{
  "coverLetter": string
}`;

export async function generateCoverLetter({ resumeText, industry, jobDescription, analysis }) {
  if (!groq) throw new Error('Groq API key is not configured for cover letter generation.');

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

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    model: modelName,
    response_format: { type: 'json_object' },
    temperature: 0.5
  });

  return JSON.parse(completion.choices[0].message.content);
}
