// POST /api/upload — accepts a PDF, extracts text using pdf-parse, stores Upload record
import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { db } from '@/lib/db';

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

    if (file.name.toLowerCase().endsWith('.pdf') || fileType === 'application/pdf') {
      try {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        await parser.destroy();
        extractedText = result.text || '';
      } catch (e: any) {
        // PDF might be image-only; fall back to text placeholder
        extractedText = `[PDF parsing failed: ${e.message}. Treat as scanned document — OCR not configured.]`;
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

    return NextResponse.json({
      id: upload.id,
      filename: upload.filename,
      size: upload.size,
      extractedText,
      textLength: extractedText.length,
      preview: extractedText.slice(0, 500)
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
