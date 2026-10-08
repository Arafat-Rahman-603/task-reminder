const sharp = require('sharp');
const fs = require('fs');

const svgBuffer = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <text x="96" y="130" font-family="system-ui, sans-serif" font-size="100" font-weight="700" fill="#ffffff" text-anchor="middle">P</text>
</svg>`);

sharp(svgBuffer)
  .png()
  .toFile('public/monochrome-icon.png')
  .then(() => console.log('monochrome-icon.png created'))
  .catch(err => console.error(err));
