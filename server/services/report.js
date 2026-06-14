import PDFDocument from 'pdfkit';

export function createReportPdf({ fileName, industry, analysis, parsedSections, atsRisks }) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const scores = analysis.scores || {};
    doc.fontSize(22).text('AI Resume ATS Analyzer Pro', { align: 'center' });
    doc.moveDown(0.4).fontSize(12).fillColor('#475569').text(`Report for ${fileName} | Industry: ${industry}`, { align: 'center' });
    doc.moveDown();
    doc.fillColor('#111827').fontSize(16).text(`Overall ATS Score: ${scores.atsScore ?? 'N/A'}/100`);
    doc.fontSize(12).text(`Final Verdict: ${analysis.finalVerdict || 'N/A'}`);
    doc.text(`Recruiter Score: ${scores.recruiterScore ?? 'N/A'}/100`);
    doc.text(`Job Match Score: ${scores.matchScore ?? 'N/A'}/100`);
    section(doc, 'Strengths', analysis.strengths);
    section(doc, 'Weaknesses', analysis.weaknesses);
    section(doc, 'ATS Risks', (analysis.atsRisks || atsRisks).map((risk) => risk.message || risk));
    section(doc, 'Missing Keywords', analysis.missingKeywords);
    section(doc, 'Top 10 Improvements', analysis.top10Improvements);
    section(doc, 'Professional Recommendations', analysis.professionalRecommendations);
    section(doc, 'Detected Sections', Object.entries(parsedSections).map(([key, value]) => `${key}: ${value ? 'Detected' : 'Missing'}`));
    doc.end();
  });
}

function section(doc, title, items = []) {
  doc.moveDown().fillColor('#111827').fontSize(15).text(title);
  doc.moveDown(0.25).fontSize(10).fillColor('#334155');
  const list = Array.isArray(items) ? items : [items];
  if (!list.length) doc.text('None detected.');
  list.slice(0, 18).forEach((item) => doc.text(`- ${String(item).slice(0, 260)}`));
}
