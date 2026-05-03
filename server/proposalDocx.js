const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType } = require('docx');

function parseProposalSections(text) {
  const sectionHeaders = [
    'EXECUTIVE SUMMARY', 'THE OPPORTUNITY', 'OUR APPROACH',
    'DELIVERABLES', 'PRODUCTION PROCESS', 'TIMELINE',
    'WHY BRAIN CHEMICALS', 'NEXT STEPS'
  ];
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const matchedHeader = sectionHeaders.find(h => trimmed.toUpperCase() === h || trimmed.toUpperCase().startsWith(h + ':'));
    if (matchedHeader) {
      if (currentSection) sections.push({ title: currentSection, content: currentContent.join('\n').trim() });
      currentSection = matchedHeader;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentSection) sections.push({ title: currentSection, content: currentContent.join('\n').trim() });
  if (!sections.length) sections.push({ title: '', content: text });
  return sections;
}

async function generateProposalDocx(proposalText, clientName, proposalType) {
  const sections = parseProposalSections(proposalText);
  const children = [];

  // Cover title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'BRAIN CHEMICALS', bold: true, size: 48, color: '1a1a1a', font: 'Arial' })],
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Brain Chemical Studios LLP', size: 22, color: '888888', font: 'Arial' })],
      spacing: { before: 0, after: 600 }
    }),
    new Paragraph({
      children: [new TextRun({ text: (proposalType || 'Campaign Proposal').toUpperCase(), bold: true, size: 28, color: '333333', font: 'Arial' })],
      spacing: { before: 0, after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `Prepared for: ${clientName}`, size: 24, color: '555555', font: 'Arial' })],
      spacing: { before: 0, after: 80 }
    }),
    new Paragraph({
      children: [new TextRun({ text: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), size: 22, color: '888888', font: 'Arial' })],
      spacing: { before: 0, after: 800 }
    }),
    // Divider
    new Paragraph({
      border: { bottom: { color: 'CCCCCC', size: 6, style: BorderStyle.SINGLE } },
      spacing: { before: 0, after: 600 }
    })
  );

  // Sections
  for (const section of sections) {
    if (section.title) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.title, bold: true, size: 26, color: '1a1a1a', font: 'Arial' })],
          spacing: { before: 480, after: 160 },
          border: { bottom: { color: 'EEEEEE', size: 4, style: BorderStyle.SINGLE } }
        })
      );
    }

    const contentLines = section.content.split('\n');
    for (const line of contentLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        children.push(new Paragraph({ spacing: { before: 0, after: 80 } }));
        continue;
      }
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
      children.push(
        new Paragraph({
          children: [new TextRun({ text: isBullet ? trimmed.substring(2) : trimmed, size: 22, color: '333333', font: 'Arial' })],
          bullet: isBullet ? { level: 0 } : undefined,
          spacing: { before: 0, after: isBullet ? 80 : 160 }
        })
      );
    }
  }

  // Footer note
  children.push(
    new Paragraph({ spacing: { before: 800, after: 0 } }),
    new Paragraph({
      border: { top: { color: 'CCCCCC', size: 4, style: BorderStyle.SINGLE } },
      children: [
        new TextRun({ text: 'Brain Chemical Studios LLP  ·  Confidential  ·  ', size: 18, color: 'AAAAAA', font: 'Arial' }),
        new TextRun({ text: new Date().getFullYear().toString(), size: 18, color: 'AAAAAA', font: 'Arial' })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 0 }
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      children
    }]
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateProposalDocx };
