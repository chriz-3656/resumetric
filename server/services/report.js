import PDFDocument from 'pdfkit';

export function createReportPdf({ fileName, industry, analysis, parsedSections, atsRisks }) {
  return new Promise((resolve) => {
    // Configure document with standard margins
    const doc = new PDFDocument({ margin: 48, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Theme Colors (Industrial ResuMetric Theme)
    const brandGreen = '#00E676';
    const bgDark = '#0a0a0a';
    const textMain = '#ffffff';
    const textDim = '#888888';

    // We use standard Helvetica since PDFKit requires custom font paths which are tricky in serverless environments.
    // However, we will simulate the "Industrial" look with strict layouts and high contrast.

    // Background fill for the entire first page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgDark);

    // HEADER
    doc.fillColor(brandGreen).fontSize(28).font('Helvetica-Bold').text('[ RM ] ResuMetric', { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor(textMain).fontSize(14).font('Helvetica').text('ENTERPRISE PROFILE ANALYTICS', { align: 'center', characterSpacing: 2 });
    doc.moveDown(2);
    
    // META INFO BOX
    doc.rect(48, doc.y, doc.page.width - 96, 60).strokeColor('#333333').lineWidth(1).stroke();
    const boxY = doc.y + 15;
    doc.fillColor(textDim).fontSize(10).text('TARGET INDUSTRY', 60, boxY);
    doc.fillColor(textMain).fontSize(12).font('Helvetica-Bold').text((analysis.inferredRole || industry).toUpperCase(), 60, boxY + 15);
    
    doc.fillColor(textDim).fontSize(10).font('Helvetica').text('FILE NAME', 300, boxY);
    doc.fillColor(textMain).fontSize(12).font('Helvetica-Bold').text(fileName, 300, boxY + 15, { width: 200, ellipsis: true });
    doc.y = boxY + 60;
    doc.moveDown(2);

    // MAIN SCORE
    const scores = analysis.scores || {};
    const atsScore = scores.atsScore ?? 0;
    
    doc.fillColor(textDim).fontSize(12).font('Helvetica').text('ATS INDEX SCORE', 48, doc.y);
    doc.fillColor(brandGreen).fontSize(48).font('Helvetica-Bold').text(`${atsScore}/100`, 48, doc.y + 5);
    doc.moveDown(1);
    
    doc.fillColor(textMain).fontSize(12).font('Helvetica').text(`VERDICT: ${analysis.finalVerdict || 'N/A'}`);
    doc.moveDown(2);

    // BAR CHARTS (Visualizing the breakdown)
    const metrics = [
      { label: 'Recruiter Confidence', val: scores.recruiterScore },
      { label: 'Keyword Optimization', val: scores.keywordOptimizationScore },
      { label: 'Formatting', val: scores.formattingScore },
      { label: 'Readability', val: scores.readabilityScore }
    ];

    doc.fillColor(brandGreen).fontSize(14).font('Helvetica-Bold').text('DIAGNOSTIC BREAKDOWN');
    doc.moveDown(1);
    
    metrics.forEach(m => {
      const val = m.val || 0;
      doc.fillColor(textMain).fontSize(10).font('Helvetica').text(`${m.label} (${val}/100)`);
      // Draw background bar
      doc.rect(48, doc.y + 5, 400, 8).fillColor('#333333').fill();
      // Draw foreground bar
      doc.rect(48, doc.y + 5, 400 * (val / 100), 8).fillColor(brandGreen).fill();
      doc.moveDown(1.5);
    });

    // START NEW PAGE FOR TEXT HEAVY CONTENT
    doc.addPage();
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgDark);
    doc.y = 48;

    // HELPER FOR SECTIONS
    const renderSection = (title, items) => {
      doc.fillColor(brandGreen).fontSize(14).font('Helvetica-Bold').text(title.toUpperCase());
      doc.moveDown(0.5);
      doc.fillColor(textMain).fontSize(10).font('Helvetica');
      
      const list = Array.isArray(items) ? items : [items];
      if (!list.length || !list[0]) {
        doc.fillColor(textDim).text('No significant data points detected.');
      } else {
        list.slice(0, 8).forEach(item => {
          doc.text(`> ${String(item)}`, { lineGap: 4 });
        });
      }
      doc.moveDown(2);
    };

    renderSection('Critical Deficiencies', analysis.weaknesses);
    renderSection('Strategic Roadmap', analysis.top10Improvements);
    renderSection('Missing Semantic Keywords', analysis.missingKeywords);
    
    // HEATMAP DATA (If available)
    if (analysis.heatmapData && analysis.heatmapData.length > 0) {
      doc.fillColor(brandGreen).fontSize(14).font('Helvetica-Bold').text('PERFORMANCE HEATMAP');
      doc.moveDown(0.5);
      
      analysis.heatmapData.forEach(segment => {
        const color = segment.impact === 'strong' ? brandGreen : segment.impact === 'weak' ? '#FF3B30' : '#FFB800';
        doc.fillColor(textMain).fontSize(10).font('Helvetica-Bold').text(segment.label.toUpperCase());
        doc.fillColor(textDim).fontSize(9).font('Helvetica').text(`Impact: ${segment.impact.toUpperCase()}`, { continued: true });
        // Draw small indicator box
        doc.rect(doc.x + 10, doc.y - 2, 8, 8).fillColor(color).fill();
        doc.moveDown(1);
      });
    }

    doc.end();
  });
}
