export const keywordLibrary = {
  Cybersecurity: ['siem', 'soc', 'incident response', 'risk assessment', 'vulnerability', 'nist', 'iso 27001', 'cloud security', 'iam', 'penetration testing'],
  Accounting: ['reconciliation', 'ledger', 'audit', 'tax', 'gaap', 'accounts payable', 'accounts receivable', 'financial statements', 'variance analysis', 'erp'],
  Finance: ['financial modeling', 'forecasting', 'valuation', 'budgeting', 'risk management', 'portfolio', 'capital markets', 'excel', 'kpi', 'reporting'],
  Marketing: ['seo', 'sem', 'campaigns', 'conversion', 'analytics', 'brand', 'content strategy', 'crm', 'lead generation', 'a/b testing'],
  'Software Engineering': ['javascript', 'typescript', 'react', 'node.js', 'api', 'database', 'testing', 'ci/cd', 'cloud', 'system design'],
  'Data Science': ['python', 'sql', 'machine learning', 'statistics', 'pandas', 'modeling', 'data visualization', 'etl', 'regression', 'nlp'],
  'Cloud Computing': ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform', 'serverless', 'monitoring', 'devops', 'iam'],
  Networking: ['tcp/ip', 'routing', 'switching', 'firewall', 'vpn', 'dns', 'dhcp', 'lan', 'wan', 'network security'],
  HR: ['recruiting', 'employee relations', 'onboarding', 'performance management', 'hris', 'compliance', 'benefits', 'talent acquisition', 'payroll', 'engagement'],
  'Project Management': ['agile', 'scrum', 'stakeholder', 'roadmap', 'budget', 'risk', 'pmp', 'jira', 'timeline', 'delivery']
};

const sectionAliases = {
  summary: ['summary', 'profile', 'objective', 'professional summary'],
  experience: ['experience', 'work experience', 'employment', 'professional experience'],
  education: ['education', 'academic background'],
  certifications: ['certifications', 'licenses'],
  skills: ['skills', 'technical skills', 'core competencies'],
  projects: ['projects', 'portfolio']
};

export function extractSections(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const contact = {
    name: lines[0] || '',
    email: text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '',
    phone: text.match(/(?:\+?\d[\d\s().-]{8,}\d)/)?.[0] || '',
    linkedIn: text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || '',
    github: text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s)]+/i)?.[0] || ''
  };

  const sections = { contact };
  for (const [key, aliases] of Object.entries(sectionAliases)) {
    sections[key] = aliases.some((alias) => lower.includes(alias)) ? extractSectionSnippet(text, aliases) : '';
  }
  return sections;
}

export function detectAtsRisks(text, sections) {
  const risks = [];
  const add = (type, severity, message) => risks.push({ type, severity, message });
  if (!sections.contact.email) add('Missing contact', 'high', 'Email address was not detected.');
  if (!sections.contact.phone) add('Missing contact', 'medium', 'Phone number was not detected.');
  if (!sections.summary) add('Missing summary', 'medium', 'Professional summary section was not detected.');
  if (!sections.skills) add('Missing skills', 'high', 'Skills section was not detected.');
  if (!sections.experience) add('Missing experience', 'high', 'Work experience section was not detected.');
  if (/\|/.test(text) || /\t{2,}/.test(text)) add('Tables or columns', 'medium', 'Text suggests tables, tab stops, or multi-column formatting.');
  if (/image|graphic|photo|headshot/i.test(text)) add('Graphics', 'low', 'Resume may reference images or graphics that ATS tools can miss.');
  if (text.length < 1200) add('Sparse content', 'medium', 'Resume content appears short for a complete professional profile.');
  return risks;
}

export function scoreFallback(text, industry, jobDescription, sections, risks) {
  const lower = text.toLowerCase();
  const keywords = keywordLibrary[industry] || keywordLibrary['Software Engineering'];
  const matchedKeywords = keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
  const jdKeywords = extractKeywords(jobDescription);
  const missingKeywords = keywords.filter((keyword) => !matchedKeywords.includes(keyword));
  const missingJdKeywords = jdKeywords.filter((keyword) => !lower.includes(keyword));
  const keywordScore = Math.round((matchedKeywords.length / keywords.length) * 100);
  const sectionScore = ['summary', 'experience', 'education', 'skills'].reduce((sum, key) => sum + (sections[key] ? 20 : 0), 0);
  const riskPenalty = risks.reduce((sum, risk) => sum + (risk.severity === 'high' ? 10 : risk.severity === 'medium' ? 6 : 3), 0);
  const atsScore = clamp(Math.round((keywordScore * 0.35) + (sectionScore * 0.45) + (readability(text) * 0.2) - riskPenalty));
  return {
    atsScore,
    recruiterScore: clamp(atsScore - 3 + Math.round(text.length / 900)),
    industryRelevanceScore: keywordScore,
    formattingScore: clamp(100 - riskPenalty * 3),
    keywordOptimizationScore: keywordScore,
    workExperienceScore: sections.experience ? 78 : 35,
    educationScore: sections.education ? 75 : 45,
    skillsScore: sections.skills ? keywordScore : 25,
    readabilityScore: readability(text),
    matchedKeywords,
    missingKeywords: [...new Set([...missingKeywords, ...missingJdKeywords])].slice(0, 25),
    matchScore: jdKeywords.length ? clamp(Math.round(((jdKeywords.length - missingJdKeywords.length) / jdKeywords.length) * 100)) : keywordScore
  };
}

function extractSectionSnippet(text, aliases) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => aliases.some((alias) => line.toLowerCase().includes(alias)));
  if (start < 0) return '';
  return lines.slice(start, start + 12).join('\n').trim();
}

function extractKeywords(text = '') {
  return [...new Set(text.toLowerCase().match(/[a-z][a-z+#.]{2,}(?:\s[a-z][a-z+#.]{2,})?/g) || [])]
    .filter((word) => !['and', 'the', 'with', 'for', 'you', 'our', 'are', 'will', 'from', 'this', 'that'].includes(word))
    .slice(0, 40);
}

function readability(text) {
  const sentences = Math.max(1, (text.match(/[.!?]/g) || []).length);
  const words = Math.max(1, text.split(/\s+/).length);
  const avg = words / sentences;
  return clamp(Math.round(100 - Math.abs(avg - 18) * 2));
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}
