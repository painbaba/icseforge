import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
// Use eval('require') to load pdf-parse and resolve pdf.worker.mjs at runtime,
// bypassing Turbopack/Next.js bundling which breaks path resolution for pdfjs-dist.
let PDFParse: any;
try {
  const pdfParseModule = eval('require')('pdf-parse');
  PDFParse = pdfParseModule.PDFParse;
  const urlModule = eval('require')('url');
  const workerPath = eval('require').resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const workerUrl = urlModule.pathToFileURL(workerPath).href;
  PDFParse.setWorker(workerUrl);
} catch (err) {
  console.error('Failed to initialize pdf-parse with runtime worker:', err);
}

export const runtime = 'nodejs';
export const maxDuration = 60;


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = '';
    let fileType = file.type || 'application/octet-stream';

    // Auto-detect image mimetype if not populated
    if (fileType === 'application/octet-stream' || !fileType) {
      if (file.name.toLowerCase().endsWith('.png')) fileType = 'image/png';
      else if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) fileType = 'image/jpeg';
      else if (file.name.toLowerCase().endsWith('.webp')) fileType = 'image/webp';
      else if (file.name.toLowerCase().endsWith('.gif')) fileType = 'image/gif';
    }

    if (file.name.toLowerCase().endsWith('.pdf') || fileType === 'application/pdf') {
      try {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        await parser.destroy();
        extractedText = result.text || '';

        // If the extracted text is too short, it's likely a scanned/image-only PDF
        if (extractedText.trim().length < 1000) {
          console.log(`PDF text extraction yielded only ${extractedText.trim().length} chars. Falling back to OCR...`);
          const { createWorker } = require('tesseract.js');
          const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
          const { createCanvas, Image } = require('canvas');

          // Polyfill global Image for pdfjs-dist
          (global as any).Image = Image;

          class NodeCanvasFactory {
            create(width: number, height: number) {
              const canvas = createCanvas(width, height);
              const context = canvas.getContext("2d");
              return { canvas, context };
            }
            reset(canvasAndContext: any, width: number, height: number) {
              canvasAndContext.canvas.width = width;
              canvasAndContext.canvas.height = height;
            }
            destroy(canvasAndContext: any) {
              canvasAndContext.canvas.width = 0;
              canvasAndContext.canvas.height = 0;
              canvasAndContext.canvas = null;
              canvasAndContext.context = null;
            }
          }

          const canvasFactory = new NodeCanvasFactory();
          const pdf = await pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            canvasFactory
          }).promise;

          const maxPagesToOcr = Math.min(pdf.numPages, 10); // Limit to first 10 pages for safety
          let ocrText = '';
          const path = require('path');
          const workerPath = path.join(process.cwd(), 'node_modules/tesseract.js/src/worker-script/node/index.js');
          const worker = await createWorker('eng', 1, { workerPath });

          for (let i = 1; i <= maxPagesToOcr; i++) {
            const page = await pdf.getPage(i);
            const scale = 2.0;
            const viewport = page.getViewport({ scale });
            const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

            const originalDrawImage = canvasAndContext.context.drawImage;
            canvasAndContext.context.drawImage = function(img: any, ...args: any[]) {
              if (img && img.constructor.name === "CanvasElement") {
                try {
                  const imgBuf = img.toBuffer('image/png');
                  const newImg = new Image();
                  newImg.src = imgBuf;
                  img = newImg;
                } catch (e) {
                  // ignore conversion error
                }
              }
              return originalDrawImage.apply(this, [img, ...args]);
            };

            const renderContext = {
              canvasContext: canvasAndContext.context,
              viewport: viewport,
              canvasFactory: canvasFactory
            };

            await page.render(renderContext).promise;
            const imgBuf = canvasAndContext.canvas.toBuffer('image/png');
            const { data: { text } } = await worker.recognize(imgBuf);
            ocrText += `\n=== PAGE ${i} ===\n${text}\n`;
            canvasFactory.destroy(canvasAndContext);
          }

          await worker.terminate();
          if (ocrText.trim().length > 50) {
            extractedText = ocrText;
          }
        }
      } catch (e: any) {
        console.error('PDF OCR extraction failed:', e);
        extractedText = `[PDF parsing and OCR failed: ${e.message}]`;
      }
    } else if (fileType.startsWith('image/')) {
      try {
        const base64Image = buffer.toString('base64');
        const imageUrl = `data:${fileType};base64,${base64Image}`;
        const { callModel } = require('@/lib/models');
        const response = await callModel({
          preferredModel: 'llama_vision',
          question: 'Extract all text, formulas, equations, tables, and diagrams from this image. Output the transcript in clean markdown. For math formulas, use LaTeX format (e.g. $...$ or $$...$$). Describe diagrams or charts in text or Mermaid syntax if applicable.',
          hasImage: true,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text, formulas, equations, tables, and diagrams from this image. Output the transcript in clean markdown. For math formulas, use LaTeX format (e.g. $...$ or $$...$$). Describe diagrams or charts in text or Mermaid syntax if applicable.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ]
        });
        extractedText = response.content || '';
      } catch (err: any) {
        extractedText = `[OCR Extraction failed: ${err.message}]`;
      }
    } else if (fileType.startsWith('text/') || file.name.match(/\.(txt|md|csv)$/i)) {
      extractedText = buffer.toString('utf-8');
    } else {
      extractedText = `[Binary file ${file.name} uploaded — text extraction not available for this format.]`;
    }

    const upload = await db.upload.create({
      data: {
        filename: file.name,
        mimeType: fileType,
        size: file.size,
        extractedText
      }
    });

    let publicUrl = '';
    try {
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const sanitizedBase = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, '_');
      const publicFileName = `${upload.id}_${sanitizedBase}`;
      const filePath = path.join(uploadsDir, publicFileName);
      fs.writeFileSync(filePath, buffer);
      publicUrl = `/uploads/${publicFileName}`;
    } catch (fsErr) {
      console.error('Failed to save file to public directory:', fsErr);
    }

    return NextResponse.json({
      id: upload.id,
      filename: upload.filename,
      size: upload.size,
      url: publicUrl || undefined,
      extractedText,
      textLength: extractedText.length,
      preview: extractedText.slice(0, 500)
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
