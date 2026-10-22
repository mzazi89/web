// Google AdSense loader.
//
// Rendered as a plain <script async> inside <head> so the exact tag Google
// issues appears in the server-rendered HTML. That keeps site verification
// unambiguous and lets the ad library download in parallel without blocking
// the first paint.

export const ADSENSE_CLIENT = 'ca-pub-8796910937166702';

export default function AdSenseScript() {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
