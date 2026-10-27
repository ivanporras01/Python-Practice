'use client';
import { useEffect, useState, type ReactNode } from 'react';

/** A prepared, native download link preserves the browser's direct click action. */
export default function DownloadLink({ name, content, mime = 'application/octet-stream', className = 'button secondary compact', children }: { name: string; content: string | Uint8Array<ArrayBuffer>; mime?: string; className?: string; children: ReactNode }) {
  const [prepared, setPrepared] = useState<{ content: typeof content; mime: string; url: string } | null>(null);
  useEffect(() => {
    const href = URL.createObjectURL(new Blob([content], { type: mime }));
    setPrepared({ content, mime, url: href });
    return () => { setTimeout(() => URL.revokeObjectURL(href), 60000); };
  }, [content, mime]);
  const url = prepared?.content === content && prepared.mime === mime ? prepared.url : undefined;
  return <a className={className} href={url} download={name.replace(/[^a-zA-Z0-9._-]/g, '_')} aria-disabled={!url} onClick={event => { if (!url) event.preventDefault(); }}>{children}</a>;
}
