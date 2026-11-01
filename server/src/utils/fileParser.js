const zlib = require('node:zlib');

/**
 * Extracts text from a Buffer based on file extension and mime type
 * Supports TXT, DOCX, and PDF formats
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Name of the uploaded file
 * @param {string} mimetype - MIME type of the uploaded file
 * @returns {{ success: boolean, text?: string, error?: string }}
 */
function parseFileText(buffer, originalname = '', mimetype = '') {
  if (!buffer || buffer.length === 0) {
    return { success: false, error: 'Uploaded file is empty.' };
  }

  const ext = originalname.split('.').pop().toLowerCase();

  try {
    // 1. Plain Text (.txt, .md, .csv)
    if (ext === 'txt' || ext === 'text' || ext === 'md' || mimetype.startsWith('text/')) {
      const text = buffer.toString('utf-8').trim();
      if (text.length > 0) {
        return { success: true, text };
      }
      return { success: false, error: 'Text file appears empty.' };
    }

    // 2. Microsoft Word (.docx)
    if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const text = extractDocxText(buffer);
      if (text && text.trim().length >= 10) {
        return { success: true, text: text.trim() };
      }
      return { success: false, error: 'Could not extract text from DOCX file. Please paste your CV text below.' };
    }

    // 3. Adobe PDF (.pdf)
    if (ext === 'pdf' || mimetype === 'application/pdf') {
      const text = extractPdfText(buffer);
      if (text && text.trim().length >= 10) {
        return { success: true, text: text.trim() };
      }
      return { success: false, error: 'Could not extract text from PDF file. Please paste your CV text below.' };
    }

    // 4. Fallback for other text-like files
    const fallbackText = extractAsciiStrings(buffer);
    if (fallbackText && fallbackText.trim().length >= 20) {
      return { success: true, text: fallbackText.trim() };
    }

    return {
      success: false,
      error: `Unsupported or unreadable file format (${ext.toUpperCase()}). Please upload a valid PDF, DOCX, or TXT file, or paste your CV text below.`
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse ${originalname}: ${err.message}. Please paste your CV text below.`
    };
  }
}

/**
 * Extracts text from DOCX zip buffer by finding word/document.xml and extracting <w:t> contents
 */
function extractDocxText(buffer) {
  // Search for ZIP Local File Header (0x04034b50)
  let offset = 0;
  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) === 0x04034b50) {
      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const uncompressedSize = buffer.readUInt32LE(offset + 22);
      const fileNameLen = buffer.readUInt16LE(offset + 26);
      const extraFieldLen = buffer.readUInt16LE(offset + 28);
      const fileName = buffer.toString('utf-8', offset + 30, offset + 30 + fileNameLen);

      const dataOffset = offset + 30 + fileNameLen + extraFieldLen;

      if (fileName === 'word/document.xml' && dataOffset + compressedSize <= buffer.length) {
        const compressedData = buffer.slice(dataOffset, dataOffset + compressedSize);
        let xmlStr = '';
        if (compressionMethod === 8) {
          // Deflated
          xmlStr = zlib.inflateRawSync(compressedData).toString('utf-8');
        } else if (compressionMethod === 0) {
          // Uncompressed
          xmlStr = compressedData.toString('utf-8');
        }

        if (xmlStr) {
          return xmlToText(xmlStr);
        }
      }

      offset = dataOffset + (compressedSize || 1);
    } else {
      offset++;
    }
  }

  // Fallback: look for XML tags directly in buffer
  return extractAsciiStrings(buffer);
}

/**
 * Converts DOCX XML string into plain readable text
 */
function xmlToText(xml) {
  // Replace paragraph endings with newlines
  let text = xml.replace(/<\/w:p>/gi, '\n');
  // Replace break elements with newlines
  text = text.replace(/<w:br[^>]*>/gi, '\n');
  text = text.replace(/<w:tab[^>]*>/gi, '\t');
  // Strip all XML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode XML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  // Normalize whitespace
  return text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}

/**
 * Extracts text from PDF buffer by parsing text streams and literal string tokens
 */
function extractPdfText(buffer) {
  let fullText = '';
  const bufStr = buffer.toString('latin1');

  // Find all stream ... endstream blocks and decompress FlateDecode if present
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamRegex.exec(bufStr)) !== null) {
    const rawStream = Buffer.from(match[1], 'latin1');
    let decompressedStr = '';

    try {
      decompressedStr = zlib.inflateSync(rawStream).toString('latin1');
    } catch {
      try {
        decompressedStr = zlib.inflateRawSync(rawStream).toString('latin1');
      } catch {
        decompressedStr = match[1];
      }
    }

    if (decompressedStr) {
      // Parse BT ... ET text blocks
      const btBlocks = decompressedStr.match(/BT[\s\S]*?ET/g) || [decompressedStr];
      for (const block of btBlocks) {
        // Match (string) Tj or [(str1) (str2)] TJ
        const tjMatches = block.match(/\((.*?)\)\s*(?:Tj|'|")/g);
        if (tjMatches) {
          for (const tj of tjMatches) {
            const inner = tj.replace(/^\(/, '').replace(/\)\s*(?:Tj|'|")$/, '');
            fullText += unescapePdfString(inner) + ' ';
          }
        }

        const arrayMatches = block.match(/\[([\s\S]*?)\]\s*TJ/g);
        if (arrayMatches) {
          for (const arr of arrayMatches) {
            const strings = arr.match(/\((.*?)\)/g);
            if (strings) {
              for (const s of strings) {
                fullText += unescapePdfString(s.slice(1, -1)) + ' ';
              }
            }
          }
        }
      }
    }
  }

  // If text stream parsing gave a good result, return it
  if (fullText.trim().length >= 20) {
    return fullText.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  }

  // Fallback: extract legible ASCII strings from PDF
  return extractAsciiStrings(buffer);
}

function unescapePdfString(str) {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/**
 * Extracts printable ASCII word sequences from buffer
 */
function extractAsciiStrings(buffer) {
  const str = buffer.toString('latin1');
  const matches = str.match(/[A-Za-z0-9+#/.,@:;()\s-]{4,}/g);
  if (!matches) return '';
  return matches
    .filter(m => !m.includes('%%PDF') && !m.includes('FontDescriptor') && !m.includes('ObjStm'))
    .join(' ')
    .replace(/\s+/g, ' ');
}

module.exports = {
  parseFileText
};
