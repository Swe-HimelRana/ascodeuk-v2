# AS Code — Interactive 3D Website

A static homepage with no build step and no dependencies: plain HTML, CSS and JavaScript.

## Files
- `index.html` — page markup (all sections)
- `css/style.css` — shared styles, animations, `--accent` colour
- `js/main.js` — 3D globe, floating parallax chips, rotating headline, tilt + spotlight cards, auto-playing process cube, scroll reveals, count-up stats, mobile menu, office clocks, enquiry form

## Run locally
Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

## Deploy
Upload the whole folder to any static host (cPanel/FTP, Netlify, Vercel, GitHub Pages, S3).

## Before going live
- Replace `[YOUR-WHATSAPP-NUMBER]` in `index.html` (international format, digits only, e.g. 447700900123).
- Replace the two `[Client quote …]` placeholders with the real testimonial text.
- Point the Privacy / Terms / Refund links in the footer to your real pages, and the News cards to your real articles.
- The enquiry form and newsletter open the visitor's email app. For real submissions, connect a form service (e.g. Formspree) or your own backend in `js/main.js`.
- Optional: swap the `</>` text mark in the header for your logo image.

## Customise
- Colours: `--accent`, `--accent-2` and friends at the top of `css/style.css` (also `ACCENT` in `js/main.js` for the globe dots).
- Headline words: the `words` list in `js/main.js`.
- Globe spin speed: `SPIN` at the top of `js/main.js`.
- Globe cities: the `cities` list in `js/main.js` (latitude, longitude).
