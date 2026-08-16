'use client';
import { useState } from 'react';

// Copy-to-clipboard button with feedback
export default function CopyButton({ text, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.1em] transition-all ${className}`}
      style={{
        color: copied ? '#3ECF8E' : '#F2A93B',
        backgroundColor: copied ? 'rgba(62,207,142,0.08)' : 'rgba(242,169,59,0.06)',
        border: `1px solid ${copied ? 'rgba(62,207,142,0.35)' : 'rgba(242,169,59,0.35)'}`,
        cursor: 'pointer',
        borderRadius: 2,
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
