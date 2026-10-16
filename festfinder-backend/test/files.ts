/** A PNG header is all the image checks read. */
export const png = (w: number, h: number) => {
  const b = Buffer.alloc(64);
  b.writeUInt32BE(0x89504e47, 0); b.write('IHDR', 12, 'ascii'); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
  return b;
};

/** One file as a multipart/form-data body, the way a browser uploads it. */
export const multipart = (file: Buffer, name = 'poster.png') => {
  const boundary = 'ff-test-boundary';
  return {
    payload: Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: image/png\r\n\r\n`), file, Buffer.from(`\r\n--${boundary}--\r\n`)]),
    type: `multipart/form-data; boundary=${boundary}`,
  };
};

/**
 * A network of images for linked-picture tests: `https://img.test/<name>.png?w=1200&h=900` is a
 * PNG of that size (1200×900 by default), a link with "broken" in it does not open, and
 * `https://page.test/<name>?img=<url>` is a web page whose preview picture is that URL.
 */
export const fakeImages = (hits: string[] = []) => async (url: string) => {
  hits.push(url);
  const u = new URL(url);
  if (/broken/.test(url)) throw new TypeError('fetch failed');
  if (u.hostname === 'page.test') {
    const html = `<html><head><meta property="og:image" content="${u.searchParams.get('img') ?? ''}"></head></html>`;
    return { url, status: 200, contentType: 'text/html; charset=utf-8', bytes: Buffer.from(html), totalBytes: html.length };
  }
  const w = Number(u.searchParams.get('w') ?? 1200);
  const h = Number(u.searchParams.get('h') ?? 900);
  return { url, status: 200, contentType: 'image/png', bytes: png(w, h), totalBytes: Number(u.searchParams.get('bytes') ?? 200_000) };
};
