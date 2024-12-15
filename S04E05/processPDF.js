import { PDFExtract } from 'pdf.js-extract';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

const pdfExtract = new PDFExtract();
const options = {
    normalizeWhitespace: true,
    disableCombineTextItems: false
};

async function processPDFWithThreshold(pdfPath, textOutputDir, pdfOutputDir, charThreshold = 50) {
    try {
        // Ensure directories exist
        if (!fs.existsSync(textOutputDir)) {
            fs.mkdirSync(textOutputDir, { recursive: true });
        }
        if (!fs.existsSync(pdfOutputDir)) {
            fs.mkdirSync(pdfOutputDir, { recursive: true });
        }

        // Extract text
        const data = await pdfExtract.extract(pdfPath, options);
        
        // Load the source PDF
        const sourceBytes = fs.readFileSync(pdfPath);
        const sourcePdfDoc = await PDFDocument.load(sourceBytes);

        for (let i = 0; i < data.pages.length; i++) {
            const page = data.pages[i];
            const text = page.content.map(item => item.str).join(' ');
            const charCount = text.length;

            console.log(`Page ${i + 1}: number of characters - ${charCount}`);

            if (charCount >= charThreshold) {
                fs.writeFileSync(`${textOutputDir}/page${i + 1}.txt`, text);
                console.log(`page ${i + 1} was saved as text file`);
            } else {
                console.log(`Page ${i + 1} is being saved as PDF`);
                // Create a new PDF document for this page
                const newPdfDoc = await PDFDocument.create();
                const [copiedPage] = await newPdfDoc.copyPages(sourcePdfDoc, [i]);
                newPdfDoc.addPage(copiedPage);
                
                // Save the single page as a new PDF
                const pdfBytes = await newPdfDoc.save();
                fs.writeFileSync(`${pdfOutputDir}/page${i + 1}.pdf`, pdfBytes);
                console.log(`Page ${i + 1} saved as PDF`);
            }
        }
    } catch (err) {
        console.error('Error processing PDF:', err);
    }
}

// Update your paths
const pdfPath = './data/notatnik-rafala.pdf';
const textOutputDir = './data/output_txt';
const pdfOutputDir = './data/output_pdf';  // Changed from imageOutputDir
const charThreshold = 50;

processPDFWithThreshold(pdfPath, textOutputDir, pdfOutputDir, charThreshold)
    .then(() => console.log('Process pdf end.'))
    .catch(err => console.error('Error during process pdf:', err));