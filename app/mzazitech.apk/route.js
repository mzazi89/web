// MZAZI TECH — https://mzazi.shop/mzazitech.apk
//
// A stable, memorable address for the Android build. It redirects to the asset
// on the `android-latest` release, so the link never has to change and the file
// is always the one the CI run published.
//
// Deliberately a redirect rather than a proxy: Vercel caps serverless responses
// at 4.5 MB and the APK is ~6 MB, so streaming it through a function would fail
// for exactly the people who need it. A 302 costs nothing and every Android
// browser follows it.

export const dynamic = 'force-dynamic';

const APK =
  'https://github.com/mzazi89/web/releases/download/android-latest/mzazi-tech-debug.apk';

export async function GET() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: APK,
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex',
    },
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 302,
    headers: { Location: APK, 'Cache-Control': 'no-store, max-age=0' },
  });
}
