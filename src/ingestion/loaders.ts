import fs from 'fs';
import path from 'path';
const pdfParse = require('pdf-parse');
import * as cheerio from 'cheerio';
import { DocumentMetadata } from '../types';
import { logger } from '../logger';

export interface RawDocument {
  text: string;
  metadata: DocumentMetadata;
}

export async function loadDocument(filePath: string, originalName: string): Promise<RawDocument> {
  const ext = path.extname(originalName).toLowerCase();
  let text = '';
  const metadata: DocumentMetadata = { source: originalName };

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      metadata.pageCount = data.numpages;
    } else if (ext === '.html' || ext === '.htm') {
      const htmlContent = fs.readFileSync(filePath, 'utf-8');
      const $ = cheerio.load(htmlContent);
      // Remove scripts and styles
      $('script, style, noscript').remove();
      // Extract text and condense whitespace
      text = $('body').text().replace(/\s+/g, ' ').trim();
      metadata.title = $('title').text();
    } else if (ext === '.md' || ext === '.txt') {
      text = fs.readFileSync(filePath, 'utf-8');
    } else {
      throw new Error(`Unsupported file extension: ${ext}`);
    }

    logger.debug(`Loaded document: ${originalName}`, { length: text.length });
    return { text, metadata };
  } catch (error) {
    logger.error(`Failed to load document: ${originalName}`, { error: (error as Error).message });
    throw error;
  }
}
