import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const systemPrompt = `Act as a Senior ATS Resume Reviewer and Career Coach. 
Analyze the resume content against industry standards. 
Provide scores, strengths, weaknesses, ATS risks, and keyword gaps.
Return response strictly in structured JSON format with camelCase keys. 
Include a 'heatmapData' array of objects: { "text": string, "impact": "strong" | "average" | "weak", "label": string }.`;

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
