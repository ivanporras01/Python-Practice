/** Start a real browser download while keeping its Blob alive for slower browsers. */
export function downloadText(name: string, text: string, mime = 'text/plain') {
  // Python source is an attachment, not a document to open in a registered viewer.
  const type = name.toLowerCase().endsWith('.py') ? 'application/octet-stream' : `${mime};charset=utf-8`;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => { anchor.remove(); URL.revokeObjectURL(url); }, 60000);
}
