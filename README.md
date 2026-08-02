# 🌷 Bouchique

> **flowers for you, [name]!** — a one-of-a-kind digital bouquet, grown just for you.

Type a name, pick a wish, and watch a hand-drawn bouquet bloom across the screen —
complete with flowers that wave hello, blow kisses, and a music-box lullaby that
shifts with your mood. Share the link and the preview itself says their name.

## ✨ Features

- **A bouquet, grown for you** — every bloom is hand-drawn SVG, randomly composed into a one-of-a-kind bunch each visit.
- **Wish presets** — Good morning, Birthday, Valentine, Girlfriends Day, Goodnight, Just because, Thinking of you, Miss you — or write your own message.
- **It feels alive** — flowers lean toward your cursor, and rest on one and it blows you a kiss (with a soft pop sound 🎀).
- **Personalized music** — a gentle music-box "Twinkle, Twinkle, Little Star" that plays lower & slower for Goodnight, brighter for Good morning… or plug in any Spotify / YouTube link, or upload your own song.
- **Personalized link previews** — paste `?name=Maya&wish=goodnight` into Discord or WhatsApp and the card reads *"flowers for you, Maya!"* with a banner tinted to the wish.
- **Emoji-free by design** — every icon on the site is a matching hand-drawn SVG doodle.
- **Sounds generated live** — Web Audio API synthesis, zero audio files to download.

## 🚀 Getting Started

```bash
npm install
npm run dev      # local dev at http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the build
npm run lint     # lint check
```

To test the link previews and OG-image function locally (exactly like production):

```bash
npx vercel dev
```

## ☁️ Deploy to Vercel

Zero config needed — Vercel auto-detects Vite and picks up the `api/` folder and `middleware.js` automatically.

```bash
npm install -g vercel
vercel          # first deploy (creates a preview URL)
vercel --prod   # ship to production
```

Or import the GitHub repo at [vercel.com/new](https://vercel.com/new) — every push to `main` deploys automatically.

### Share links

| Param | Meaning |
|---|---|
| `?name=` | the person's name (shows in the card & banner) |
| `?wish=` | preset key — also tints the OG banner palette |
| `?msg=` | custom message |
| `?from=` | who it's from |
| `?music=` | a Spotify/YouTube URL to autoplay |
| `?seed=` | lock in a specific bouquet composition |

## 🛠️ Tech

- **React + Vite** — fast, tiny, no runtime deps
- **Web Audio API** — synthesized lullabies, pops, and chimes
- **Vercel Functions + Edge Middleware** — personalized OG banner rendering and chat-link previews
- **Hand-drawn SVG** — every flower and icon, drawn by hand

## 📄 License

[MIT](LICENSE) — free to use, modify, and share.

---

<p align="center">
  <i>Made with 💖 — send a bouquet, make someone's day.</i>
</p>
