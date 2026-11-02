/** Export a DOM node (the ticket) as a PNG — html-to-image is loaded only when needed. */
export async function downloadNodeAsPng(node, filename) {
  const { toPng } = await import('html-to-image');
  const bg = getComputedStyle(document.body).backgroundColor;
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: bg });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/** Trigger a download for in-memory text (JSON / CSV exports). */
export function downloadText(text, filename, type = 'application/json') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
