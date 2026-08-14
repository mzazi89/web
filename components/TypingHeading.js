'use client';
import { useState, useEffect } from 'react';

// Typewriter heading: types `text` character by character with a blinking
// blue caret, then keeps the caret hidden once done (or blinking briefly).
// Props: text, as ('h1'|'h2'|...), speed (ms/char), delay (ms before start),
//        showCaretAfterDone (default false), className, style
export default function TypingHeading({
  text,
  as: Tag = 'h1',
  speed = 45,
  delay = 0,
  showCaretAfterDone = false,
  className = '',
  style,
}) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  // Reset + (re)start whenever the text changes (e.g. step-based headings).
  useEffect(() => {
    setDisplayed('');
    setStarted(false);
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
      return () => clearTimeout(t);
    }
  }, [started, displayed, text, speed]);

  const done = displayed.length >= text.length;

  return (
    <Tag className={className} style={style}>
      {displayed}
      {(!done || showCaretAfterDone) && started && <span className="typing-caret" />}
    </Tag>
  );
}
