/** Reads width/height from PNG, JPEG or WebP headers without decoding the image. */
export function imageInfo(buf: Buffer): { mime: 'image/png' | 'image/jpeg' | 'image/webp'; width: number; height: number } | null {
  // PNG: signature, then IHDR width/height as big-endian u32 at 16/20.
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47 && buf.toString('ascii', 12, 16) === 'IHDR') {
    return { mime: 'image/png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: walk segments to the first start-of-frame marker.
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) return { mime: 'image/jpeg', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      i += 2 + len;
    }
    return null;
  }
  // WebP: RIFF....WEBP then VP8 / VP8L / VP8X chunk.
  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return { mime: 'image/webp', width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
    if (chunk === 'VP8 ') {
      return { mime: 'image/webp', width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { mime: 'image/webp', width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
    }
  }
  return null;
}

export type WebImageMime = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/avif';

/**
 * Width/height of any image a browser shows from a link: what imageInfo reads, plus GIF and
 * AVIF. Uploads stay PNG, JPEG or WebP (imageInfo); a linked image may be any of these.
 */
export function webImageInfo(buf: Buffer): { mime: WebImageMime; width: number; height: number } | null {
  const known = imageInfo(buf);
  if (known) return known;
  // GIF: "GIF87a"/"GIF89a", then the logical screen's width/height as little-endian u16.
  if (buf.length >= 10 && buf.toString('ascii', 0, 4) === 'GIF8') {
    return { mime: 'image/gif', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  // AVIF: an ISO-BMFF "ftyp" box naming avif/avis; the size is in the first "ispe" box
  // (4-byte version and flags, then width and height as big-endian u32).
  if (buf.length >= 16 && buf.toString('ascii', 4, 8) === 'ftyp' && /avi[fs]/.test(buf.toString('ascii', 8, Math.min(buf.length, 64)))) {
    const at = buf.indexOf('ispe', 0, 'ascii');
    if (at > 0 && at + 16 <= buf.length) return { mime: 'image/avif', width: buf.readUInt32BE(at + 8), height: buf.readUInt32BE(at + 12) };
  }
  return null;
}
