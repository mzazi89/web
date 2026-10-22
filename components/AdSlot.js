'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT } from './AdSenseScript';

/**
 * A single manual AdSense unit.
 *
 *   <AdSlot slot="1234567890" />
 *
 * `slot` is the data-ad-slot value shown in the AdSense dashboard for a
 * display unit. Auto ads do not need this component at all — they place
 * themselves as soon as the loader script is on the page.
 */
export default function AdSlot({ slot, format = 'auto', responsive = true, className = '', style }) {
  const pushed = useRef(false);

  useEffect(() => {
    // Guard against StrictMode running the effect twice, which makes AdSense
    // log "All ins elements ... already have ads in them".
    if (pushed.current) return;
    pushed.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Library not ready yet — it retries by itself.
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
