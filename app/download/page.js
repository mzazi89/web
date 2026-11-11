import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { AppBackground, PageHeader, Button, Card, Icons } from '@/components/ui';

// MZAZI TECH — /download.
//
// The APK has been published at /mzazitech.apk for a while, but nothing on the
// site linked to it: a customer had to already know the URL. This page is that
// link, and it reads public/app-version.json so the version it advertises is
// the version CI actually published — not a number typed into JSX that quietly
// goes stale.

export const metadata = {
  title: 'Android app — MZAZI TECH',
  description:
    'Install the MZAZI TECH Android app: panels, bots, wallet and support, plus update prompts and notifications. Direct APK download for Android 8.0 and newer.',
  alternates: { canonical: 'https://www.mzazi.shop/download' },
};

function readVersion() {
  try {
    const file = path.join(process.cwd(), 'public', 'app-version.json');
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      version: typeof doc.version === 'string' ? doc.version : null,
      versionCode: Number.isFinite(doc.versionCode) ? doc.versionCode : null,
      publishedAt: doc.publishedAt || null,
      notes: doc.notes || null,
    };
  } catch {
    // A missing file must not turn the download page into an error page.
    return { version: null, versionCode: null, publishedAt: null, notes: null };
  }
}

const INCLUDED = [
  { icon: Icons.Dashboard, title: 'The whole panel', desc: 'Dashboard, devices, wallet, marketplace and support — the same site, full screen.' },
  { icon: Icons.Bell, title: 'Notifications', desc: 'Payments, plan expiry and announcements, checked while the app is open.' },
  { icon: Icons.Refresh, title: 'Built-in updates', desc: 'The app checks for a newer build on launch and offers it without a store.' },
  { icon: Icons.Shield, title: 'Your session stays yours', desc: 'The same HTTPS login as the browser. No extra password, no extra copy of your data.' },
];

export default function DownloadPage() {
  const v = readVersion();
  const published = v.publishedAt
    ? new Date(v.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <AppBackground>
      <div className="container-site" style={{ paddingTop: 22, paddingBottom: 28, maxWidth: 960 }}>
        <PageHeader
          title="MZAZI TECH for Android"
          description="Install the app straight from here — no Play Store account, no charge."
          icon={<Icons.Phone size={20} />}
          breadcrumb={['Home', 'Android app']}
        />

        {/* ── Download ── */}
        <Card style={{ padding: '18px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--brand)', flexShrink: 0 }}>
              <Icons.Bot size={34} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 750, color: 'var(--ink)', fontSize: 16 }}>
                MZAZI TECH{v.version ? ` ${v.version}` : ''}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
                Android 8.0 or newer
                {v.versionCode ? ` · build ${v.versionCode}` : ''}
                {published ? ` · published ${published}` : ''}
              </p>
            </div>
            <Button href="/mzazitech.apk" variant="primary" icon={<Icons.ArrowRight size={16} />}>
              Download APK
            </Button>
          </div>

          {v.notes && (
            <p style={{ margin: '14px 0 0', paddingTop: 12, borderTop: '1px solid var(--line-soft)', fontSize: 12.5, color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--ink-2)' }}>What&apos;s new:</strong> {v.notes}
            </p>
          )}
        </Card>

        {/* ── Install ── */}
        <Card style={{ padding: '16px 18px', marginBottom: 16 }}>
          <p className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--dim)', margin: '0 0 12px' }}>
            Installing it
          </p>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 10 }}>
            {[
              'Tap Download APK. Your browser saves mzazitech.apk, usually in Downloads.',
              'Open the file. Android asks whether to allow installs from this app — allow it once.',
              'Tap Install, then Open. Sign in with the same account you use on the site.',
            ].map((step, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>{step}</li>
            ))}
          </ol>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--dim)', lineHeight: 1.55 }}>
            Play Protect may warn that the app is from an unknown developer. That warning appears for
            every app installed outside Google Play; it is not a virus report.
          </p>
        </Card>

        {/* ── What's inside ── */}
        <div className="grid-2-responsive" style={{ marginBottom: 16 }}>
          {INCLUDED.map((f) => (
            <Card key={f.title} style={{ padding: '14px 16px', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 1 }}>
                <f.icon size={17} />
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{f.title}</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, lineHeight: 1.55, color: 'var(--muted)' }}>{f.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Updates and honesty ── */}
        <Card style={{ padding: '16px 18px' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>
            Already have it? It updates itself.
          </p>
          <p style={{ margin: '5px 0 0', fontSize: 12.5, lineHeight: 1.65, color: 'var(--muted)' }}>
            Every launch checks the published version and offers the newer build. Builds from
            version 1.0.2 onward share one signing certificate, so updates install over the old copy
            and keep you signed in. If you still have 1.0.0 or 1.0.1, uninstall once — those two were
            signed with a throwaway key.
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, lineHeight: 1.65, color: 'var(--muted)' }}>
            The app is supported by ads from Google AdMob. It never asks for your WhatsApp password,
            and — as the{' '}
            <Link href="/privacy#messages" className="link">privacy policy</Link> explains — it cannot
            read the chats of a number that has a bot linked. See also the{' '}
            <Link href="/terms" className="link">terms of service</Link>.
          </p>
        </Card>
      </div>
    </AppBackground>
  );
}
