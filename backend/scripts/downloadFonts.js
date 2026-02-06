/**
 * Script to download Sarabun Thai font for PDF generation
 * Run: node scripts/downloadFonts.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FONT_DIR = path.join(__dirname, '../src/assets/fonts');

// Google Fonts direct download URLs for Sarabun
const FONTS = [
    {
        name: 'Sarabun-Regular.ttf',
        url: 'https://raw.githubusercontent.com/nicholaspad/nicholaspad.github.io/main/public/fonts/Sarabun-Regular.ttf'
    },
    {
        name: 'Sarabun-Bold.ttf',
        url: 'https://raw.githubusercontent.com/nicholaspad/nicholaspad.github.io/main/public/fonts/Sarabun-Bold.ttf'
    }
];

// Ensure fonts directory exists
if (!fs.existsSync(FONT_DIR)) {
    fs.mkdirSync(FONT_DIR, { recursive: true });
    console.log('Created fonts directory:', FONT_DIR);
}

const downloadFont = (font) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(FONT_DIR, font.name);

        // Delete existing file if it's too small (corrupted)
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size < 1000) {
                console.log(`Deleting corrupted ${font.name} (${stats.size} bytes)`);
                fs.unlinkSync(filePath);
            } else {
                console.log(`✓ ${font.name} already exists (${stats.size} bytes)`);
                resolve();
                return;
            }
        }

        console.log(`Downloading ${font.name}...`);

        const file = fs.createWriteStream(filePath);

        https.get(font.url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`✓ Downloaded ${font.name}`);
                        resolve();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✓ Downloaded ${font.name}`);
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(filePath, () => { }); // Delete incomplete file
            reject(err);
        });
    });
};

async function main() {
    console.log('=== Downloading Thai Fonts for PDF ===\n');

    for (const font of FONTS) {
        try {
            await downloadFont(font);
        } catch (err) {
            console.error(`✗ Failed to download ${font.name}:`, err.message);
        }
    }

    console.log('\n=== Done! Restart backend to apply ===');
}

main();
