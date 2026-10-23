import PairScreen from '../PairScreen';

// MZAZI TECH — /pair/quartz. Pairs QUARTZ XD only.

export const metadata = {
  title: 'Pair QUARTZ XD — MZAZI TECH',
  description:
    'Connect your WhatsApp number to QUARTZ XD. Enter the number, get an 8-character pairing code and link the device from WhatsApp in under a minute.',
  alternates: { canonical: 'https://www.mzazi.shop/pair/quartz' },
};

export default function PairQuartzPage() {
  return <PairScreen kind="quartz" />;
}
