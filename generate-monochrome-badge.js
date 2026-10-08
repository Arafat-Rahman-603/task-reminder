const sharp = require('sharp');

async function createColoredTransparentIcon() {
  try {
    const { data, info } = await sharp('public/icon-192x192.png')
      .raw()
      .toBuffer({ resolveWithObject: true });

    const numPixels = info.width * info.height;
    const outData = Buffer.alloc(numPixels * 4);

    for (let i = 0; i < numPixels; i++) {
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];
      
      // Calculate alpha based on how bright the pixel is compared to the dark background
      // The background is around (9, 9, 11). 
      let alpha = 0;
      if (b > 12) {
        alpha = Math.min(255, (b - 12) * 5); // Scale up to 255 quickly for solid logo
      }
      
      // Keep the original blue colors! 
      outData[i * 4] = r;         // R
      outData[i * 4 + 1] = g;     // G
      outData[i * 4 + 2] = b;     // B
      outData[i * 4 + 3] = alpha; // A
    }

    await sharp(outData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png()
    .toFile('public/monochrome-icon.png');
    
    console.log('Successfully created monochrome-icon.png with ORIGINAL brand colors and transparent background');
  } catch (err) {
    console.error('Error generating icon:', err);
  }
}

createColoredTransparentIcon();
