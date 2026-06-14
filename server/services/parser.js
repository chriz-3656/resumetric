import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function parseResumeFile(file) {
  if (file.mimetype === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return normalizeText(data.text);
  }

  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return normalizeText(data.value);
  }

  throw new Error('Only PDF and DOCX files are supported');
}

function normalizeText(text = '') {
  const cleaned = text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (cleaned.length < 50) throw new Error('Could not extract enough resume text from this file');
  return cleaned;
}
