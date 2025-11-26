import HTMLtoDOCX from '@turbodocx/html-to-docx';

/**
 * Vercel Serverless Function
 * Converts HTML to Word document (.docx) using @turbodocx/html-to-docx
 *
 * Endpoint: /api/html-to-docx
 * Method: POST
 * Body: { html: string }
 * Returns: .docx file as Buffer
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Generating Word document from HTML...');

    // Convert HTML to Word document
    const docxBuffer = await HTMLtoDOCX(html, null, {
      orientation: 'landscape',
      margins: {
        top: 720, // 0.5 inch in twips (1 inch = 1440 twips)
        right: 720,
        bottom: 720,
        left: 720
      }
    });

    console.log('Word document generated successfully, size:', docxBuffer.length);

    // Send Word document as response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Length', docxBuffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename="pcal-report.docx"');

    return res.send(docxBuffer);

  } catch (error) {
    console.error('Word document generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate Word document',
      details: error.message
    });
  }
}
