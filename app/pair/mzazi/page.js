import PairScreen from '../PairScreen';

// MZAZI TECH — /pair/mzazi. Pairs MZAZI XMD only.

export const metadata = {
  title: 'Pair MZAZI XMD — MZAZI TECH',
  description:
    'Connect your WhatsApp number to MZAZI XMD. Enter the number, get an 8-character pairing code and link the device from WhatsApp in under a minute.',
  alternates: { canonical: 'https://www.mzazi.shop/pair/mzazi' },
};

export default function PairMzaziPage() {
  return <PairScreen kind="mzazi" />;
}
