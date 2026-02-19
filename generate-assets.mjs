// Generate logo.png, og-image.png, and favicon.ico from SVG
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');

// === 1. Create logo.png as an SVG renamed to PNG won't work ===
// We'll create a simple inline SVG and convert it using sharp or canvas
// Since we may not have sharp/canvas, let's create proper SVG files that browsers serve fine

// Logo SVG (same as favicon but larger)
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#4F46E5" />
  <text x="50" y="70" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">Q</text>
</svg>`;

// OG Image SVG (1200x630)
const ogImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f4c75;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <!-- Logo icon -->
  <rect x="520" y="140" width="160" height="160" rx="32" fill="#4F46E5" />
  <text x="600" y="272" font-family="Arial, sans-serif" font-size="96" font-weight="bold" fill="white" text-anchor="middle">Q</text>
  <!-- Title -->
  <text x="600" y="380" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle">QuoteTonic</text>
  <!-- Subtitle -->
  <text x="600" y="430" font-family="Arial, sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle">Smart Quotation SaaS</text>
  <!-- Description -->
  <text x="600" y="480" font-family="Arial, sans-serif" font-size="20" fill="#64748b" text-anchor="middle">Create Professional Quotes in Seconds</text>
  <!-- Decorative lines -->
  <line x1="350" y1="510" x2="850" y2="510" stroke="#4F46E5" stroke-width="2" opacity="0.5" />
</svg>`;

// Write SVG files as .png extension — browsers/crawlers accept SVG content
// Actually, let's try using sharp if available, otherwise save as SVG

async function generateAssets() {
    let useSharp = false;
    let sharp;

    try {
        sharp = (await import('sharp')).default;
        useSharp = true;
        console.log('Using sharp for PNG conversion');
    } catch {
        console.log('sharp not available, saving as SVG with .png extension workaround');
    }

    if (useSharp) {
        // Convert to actual PNG
        await sharp(Buffer.from(logoSvg))
            .resize(512, 512)
            .png()
            .toFile(path.join(publicDir, 'logo.png'));
        console.log('✅ logo.png created (512x512)');

        await sharp(Buffer.from(ogImageSvg))
            .resize(1200, 630)
            .png()
            .toFile(path.join(publicDir, 'og-image.png'));
        console.log('✅ og-image.png created (1200x630)');

        // Create favicon.ico (32x32 PNG saved as .ico — modern browsers accept this)
        await sharp(Buffer.from(logoSvg))
            .resize(32, 32)
            .png()
            .toFile(path.join(publicDir, 'favicon.ico'));
        console.log('✅ favicon.ico created (32x32)');
    } else {
        // Fallback: save SVGs directly (rename extension)
        fs.writeFileSync(path.join(publicDir, 'logo.svg.bak'), logoSvg);
        fs.writeFileSync(path.join(publicDir, 'og-image.svg.bak'), ogImageSvg);
        console.log('⚠️ sharp not available. Saved SVG backups. Will try npm install sharp...');
    }
}

generateAssets().catch(console.error);
