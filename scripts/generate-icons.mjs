import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181c26" />
      <stop offset="50%" stop-color="#10121a" />
      <stop offset="100%" stop-color="#07080b" />
    </linearGradient>

    <radialGradient id="centerGlow" cx="50%" cy="48%" r="45%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#d97706" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#07080b" stop-opacity="0" />
    </radialGradient>

    <!-- Metallic Gold Gradients -->
    <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="25%" stop-color="#fef08a" />
      <stop offset="60%" stop-color="#f59e0b" />
      <stop offset="90%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>

    <linearGradient id="goldReflect" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#fef08a" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#b45309" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="goldDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="60%" stop-color="#b45309" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>

    <!-- Spade Blue Steel Gradient -->
    <linearGradient id="steelBlade" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Emerald Bastoni Gradient -->
    <linearGradient id="emeraldStem" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6ee7b7" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Card Rim Gradient -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.3" />
    </linearGradient>

    <!-- Filters -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
    </filter>

    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#f59e0b" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- 1. Canvas Base -->
  <rect width="512" height="512" fill="url(#bgGrad)" />
  <rect width="512" height="512" fill="url(#centerGlow)" />

  <!-- 2. Subtle Card Geometric Rim (Safe zone for iOS/Android squircle) -->
  <rect x="40" y="40" width="432" height="432" rx="96" fill="#13161f" fill-opacity="0.5" stroke="url(#rimGrad)" stroke-width="2" />
  <rect x="48" y="48" width="416" height="416" rx="88" fill="none" stroke="#f59e0b" stroke-opacity="0.08" stroke-width="1" />

  <!-- 3. Crossed Scimitars / Spade Blades in background -->
  <g filter="url(#dropShadow)" opacity="0.85">
    <!-- Left Blade -->
    <path d="M190 120 C 230 180, 270 240, 340 310 L 330 320 C 260 250, 220 190, 180 130 Z" fill="url(#steelBlade)" />
    <!-- Right Blade -->
    <path d="M322 120 C 282 180, 242 240, 172 310 L 182 320 C 252 250, 292 190, 332 130 Z" fill="url(#steelBlade)" />
  </g>

  <!-- 4. The Grand Asso di Coppe (Golden Chalice) -->
  <g filter="url(#goldGlow)">
    <!-- Ornate Chalice Handles -->
    <path d="M165 200 C 120 205, 120 270, 175 280 C 160 270, 145 250, 155 225 C 162 210, 170 205, 180 205 Z" fill="url(#goldDark)" />
    <path d="M347 200 C 392 205, 392 270, 337 280 C 352 270, 367 250, 357 225 C 350 210, 342 205, 332 205 Z" fill="url(#goldDark)" />

    <!-- Chalice Stem & Base -->
    <!-- Base Plate -->
    <path d="M176 385 C 176 370, 336 370, 336 385 L 348 405 C 348 412, 164 412, 164 405 Z" fill="url(#goldDark)" />
    <ellipse cx="256" cy="386" rx="72" ry="10" fill="url(#goldLight)" />
    <ellipse cx="256" cy="404" rx="86" ry="7" fill="url(#goldLight)" />

    <!-- Stem Column -->
    <path d="M246 295 L 246 380 L 266 380 L 266 295 Z" fill="url(#goldLight)" />
    <!-- Stem Central Jewel / Node -->
    <ellipse cx="256" cy="336" rx="26" ry="14" fill="url(#goldLight)" />
    <ellipse cx="256" cy="336" rx="20" ry="10" fill="url(#goldDark)" />
    <circle cx="256" cy="336" r="6" fill="#10b981" />

    <!-- Chalice Cup Body -->
    <path d="M168 185 C 172 265, 215 305, 256 305 C 297 305, 340 265, 344 185 Z" fill="url(#goldLight)" />

    <!-- Cup Shading Layer -->
    <path d="M168 185 C 172 265, 215 305, 256 305 C 256 305, 240 240, 240 185 Z" fill="#b45309" fill-opacity="0.3" />

    <!-- Specular Highlight (Rim reflection) -->
    <path d="M180 195 C 185 250, 210 280, 230 290 C 215 275, 195 245, 190 195 Z" fill="url(#goldReflect)" />

    <!-- Flared Regal Rim -->
    <ellipse cx="256" cy="185" rx="88" ry="18" fill="url(#goldDark)" />
    <ellipse cx="256" cy="183" rx="85" ry="15" fill="url(#goldLight)" />
    <ellipse cx="256" cy="181" rx="78" ry="10" fill="#78350f" fill-opacity="0.6" />

    <!-- 5. Denari Sun Symbol embossed on the cup -->
    <g transform="translate(256, 240)">
      <!-- Radiant Rays -->
      <circle cx="0" cy="0" r="28" fill="url(#goldDark)" />
      <circle cx="0" cy="0" r="24" fill="url(#goldLight)" />
      <!-- Star / Sunburst -->
      <path d="M0 -20 L4 -6 L18 -6 L8 3 L12 17 L0 9 L-12 17 L-8 3 L-18 -6 L-4 -6 Z" fill="#d97706" />
      <circle cx="0" cy="0" r="6" fill="#ffffff" />
    </g>

    <!-- 6. Crown of Briscola sitting atop the chalice -->
    <g transform="translate(256, 142)">
      <path d="M-52 14 L-44 -14 L-18 0 L0 -24 L18 0 L44 -14 L52 14 Z" fill="url(#goldLight)" filter="url(#dropShadow)" />
      <!-- Crown Jewels -->
      <circle cx="0" cy="-24" r="4.5" fill="#ef4444" />
      <circle cx="-44" cy="-14" r="4" fill="#38bdf8" />
      <circle cx="44" cy="-14" r="4" fill="#38bdf8" />
      <!-- Crown Base Rim -->
      <rect x="-52" y="10" width="104" height="6" rx="3" fill="url(#goldDark)" />
      <circle cx="-26" cy="13" r="2" fill="#ffffff" />
      <circle cx="0" cy="13" r="2.5" fill="#10b981" />
      <circle cx="26" cy="13" r="2" fill="#ffffff" />
    </g>
  </g>

  <!-- 7. Four Subtle Corner Seeds (Card Pips in the frame) -->
  <g opacity="0.75">
    <!-- Top Left: Coppe Cup pip -->
    <g transform="translate(76, 76)">
      <path d="M-6 -8 C-6 -2, -3 2, 0 3 C3 2, 6 -2, 6 -8 Z M-2 3 L-2 7 L-5 9 L5 9 L2 7 L2 3 Z" fill="#f59e0b" />
    </g>

    <!-- Top Right: Spade Sword pip -->
    <g transform="translate(436, 76)">
      <path d="M0 -9 C-5 -2, -6 3, 0 8 C6 3, 5 -2, 0 -9 Z M-1 8 L-1 11 L-3 12 L3 12 L1 11 L1 8 Z" fill="#38bdf8" />
    </g>

    <!-- Bottom Left: Bastoni Club pip -->
    <g transform="translate(76, 436)">
      <circle cx="0" cy="0" r="5" fill="#10b981" />
      <rect x="-2" y="3" width="4" height="7" rx="1" fill="#10b981" />
    </g>

    <!-- Bottom Right: Denari Coin pip -->
    <g transform="translate(436, 436)">
      <circle cx="0" cy="0" r="6" fill="#eab308" />
      <circle cx="0" cy="0" r="3" fill="#ca8a04" />
    </g>
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(__dirname, '..', 'public');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  const svgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(svgPath, svgIcon, 'utf8');

  const svgBuffer = Buffer.from(svgIcon);

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(appDir, 'apple-icon.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(appDir, 'icon.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
