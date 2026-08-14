// robots.txt — SEO
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/wallet'] },
    ],
    sitemap: 'https://www.mzazi.shop/sitemap.xml',
  };
}
