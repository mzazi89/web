'use client';
import CopyButton from './CopyButton';

// Code block with a copy button — no external syntax highlighter needed
export default function CodeBlock({ code, lang = 'json', label = null }) {
  return (
    <div className="overflow-hidden" style={{ backgroundColor: '#0B0D0F', border: '1px solid #262C33', borderRadius: 6 }}>
      {(label || lang) && (
        <div className="flex items-center justify-between px-4 py-2" style={{ background: '#0F1215', borderBottom: '1px solid #1B2026' }}>
          <span className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#79818A' }}>{label || lang}</span>
          <CopyButton text={code} label="Copy" />
        </div>
      )}
      {!label && !lang && (
        <div className="flex justify-end px-3 pt-2">
          <CopyButton text={code} label="Copy" />
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono" style={{ color: '#AEB5BD', maxHeight: 480 }}>
        {code}
      </pre>
    </div>
  );
}
