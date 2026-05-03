async function generateProposalPdf(proposalText, clientName, proposalType) {
  const puppeteer = require('puppeteer');

  const sectionHeaders = [
    'EXECUTIVE SUMMARY', 'THE OPPORTUNITY', 'OUR APPROACH',
    'DELIVERABLES', 'PRODUCTION PROCESS', 'TIMELINE',
    'WHY BRAIN CHEMICALS', 'NEXT STEPS'
  ];

  function formatContent(text) {
    let html = '';
    const lines = text.split('\n');
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<br/>';
        continue;
      }
      const isHeader = sectionHeaders.some(h => trimmed.toUpperCase() === h || trimmed.toUpperCase().startsWith(h + ':'));
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');

      if (isHeader) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h2 class="section-title">${trimmed}</h2>`;
      } else if (isBullet) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${trimmed.substring(2)}</li>`;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p>${trimmed}</p>`;
      }
    }
    if (inList) html += '</ul>';
    return html;
  }

  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; color: #1a1a1a; background: #fff; }
  .page { padding: 64px 72px; min-height: 100vh; }

  .cover { margin-bottom: 64px; padding-bottom: 40px; border-bottom: 1px solid #e0e0e0; }
  .studio-name { font-size: 36px; font-weight: 700; letter-spacing: -0.5px; color: #0a0a0a; }
  .studio-sub { font-size: 13px; color: #999; margin-top: 4px; margin-bottom: 48px; letter-spacing: 0.05em; }
  .proposal-type { font-size: 18px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  .client-info { font-size: 14px; color: #666; margin-bottom: 4px; }
  .proposal-date { font-size: 13px; color: #999; }

  .accent-bar { width: 40px; height: 3px; background: #1a1a1a; margin-bottom: 48px; }

  h2.section-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #0a0a0a;
    margin-top: 40px;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eeeeee;
  }

  p { font-size: 13px; line-height: 1.75; color: #333; margin-bottom: 10px; }
  ul { padding-left: 20px; margin-bottom: 10px; }
  li { font-size: 13px; line-height: 1.75; color: #333; margin-bottom: 4px; }
  br { display: block; margin: 6px 0; }

  .footer {
    margin-top: 80px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #bbb;
  }
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <div class="studio-name">BRAIN CHEMICALS</div>
    <div class="studio-sub">Brain Chemical Studios LLP</div>
    <div class="accent-bar"></div>
    <div class="proposal-type">${proposalType || 'Campaign Proposal'}</div>
    <div class="client-info">Prepared for: ${clientName}</div>
    <div class="proposal-date">${date}</div>
  </div>

  <div class="content">
    ${formatContent(proposalText)}
  </div>

  <div class="footer">
    <span>Brain Chemical Studios LLP — Confidential</span>
    <span>${new Date().getFullYear()}</span>
  </div>
</div>
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const buffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await browser.close();
  return buffer;
}

module.exports = { generateProposalPdf };
