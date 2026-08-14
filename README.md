<div align="center">

# ⚡ MZAZI TECH

### The main website — hosting, WhatsApp automation & developer APIs

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=nextdotjs&logoColor=white)
![Neon](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E4BC?logo=postgresql&logoColor=white)
![Auth](https://img.shields.io/badge/Auth-bcrypt%20%2B%20JWT-blue)
![Paystack](https://img.shields.io/badge/Payments-Paystack-00C3F7?logo=paystack)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa)

**[mzazi.shop](https://mzazi.shop)** · [Admin Panel](https://github.com/mzazi89/admin) · [WhatsApp Bot](https://github.com/mzazi89/quartz) · [Baileys Fork](https://github.com/mzazi89/baileys)

</div>

---

## 🚀 Overview

MZAZI TECH is a full product website: **panel hosting sales, WhatsApp bot pairing, wallet, and
developer APIs** — all in one dark, animated black-and-blue experience. It runs on **Next.js 14
(App Router)** with a **Neon PostgreSQL** backend shared with the admin panel and the WhatsApp bot.

## ✨ Features

| | |
|---|---|
| 🔐 **Manual Auth** | bcrypt-hashed passwords + JWT session cookie — no third-party auth |
| 👛 **Wallet** | KES balances, deposits via Paystack, debit/refund transaction history |
| 🤖 **WhatsApp Bot** | Pair your number from the site; manage devices (unlink = logout, delete = full wipe) |
| 📦 **Products** | Pterodactyl panel & package sales with order tracking |
| 🔑 **Developer APIs** | API keys, explorer, status page & docs |
| 🎁 **Referrals** | Referral codes + commissions |
| 🎨 **Design** | Live particle background (6 themes, 60s cycle), typewriter headings, custom click loader |
| 📱 **PWA** | Installable, offline-ready |

## 🗂 Pages

`Home (About/Vision/Mission/Motto)` · `Login` · `Signup` · `Forgot password` · `Dashboard` ·
`Products` · `WhatsApp Bot (pairing)` · `Wallet` · `API` · `API Docs/Status/Explorer` ·
`Temp Numbers` · `Testimonials` · `Contact` · `About` · `Privacy` · `Terms`

## ⚙️ Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (shared with admin + bot) |
| `JWT_SECRET` | Secret for the user session cookie |
| `NEXT_PUBLIC_BASE_URL` | Public site URL |
| `PAYSTACK_SECRET_KEY` / `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack API keys |
| `PTERODACTYL_URL` / `PTERODACTYL_API_KEY` | Panel server provisioning |
| `DAVIDCYRIL_API_URL` / `DAVIDCYRIL_API_KEY` | API provider |
| `DREXAPP_API_URL` / `DREXAPP_API_KEY` | API provider |
| `ALLOWED_ORIGINS` | CORS allow-list for the public API |

## 🏗 Architecture

```
web (this repo)   → public site @ mzazi.shop
admin/            → admin panel @ admin.mzazi.shop   (separate repo)
quartz/           → WhatsApp + Telegram bot          (separate repo)
baileys/          → custom Baileys fork (MZAZIBOT pairing, buttons)
                       └── all share the SAME Neon database
```

**Admin is fully separated** — see [mzazi89/admin](https://github.com/mzazi89/admin). The main
site contains no admin code; both read/write the same `Neon` schema (users, wallet,
WhatsAppSession, bot_control, providers…).

## ☁️ Deployment

Deploy `main` to Vercel. Set the environment variables above, then connect it to the same
`DATABASE_URL` used by the admin panel and the bot.

## 📦 Related Repos

- [**admin**](https://github.com/mzazi89/admin) — standalone admin panel (same DB)
- [**quartz**](https://github.com/mzazi89/quartz) — WhatsApp × Telegram bot (same DB)
- [**baileys**](https://github.com/mzazi89/baileys) — custom Baileys fork (MZAZIBOT pairing + button support)

---

<div align="center"><sub>MZAZI TECH INC — Power Your Digital World ⚡</sub></div>
