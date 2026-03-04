const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '../dist');
const FILES_TO_COPY = [
    'manifest.json',
    'content.js',
    'popup.js',
    'popup.html',
    'background.js',
    '_locales',
    'adapters',
    'components',
    'icons',
    'styles/content.css',
    'utils',
    'README.md'
];

function cleanDist() {
    if (fs.existsSync(DIST_DIR)) {
        console.log('[build] Cleaning dist directory...');
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DIST_DIR);
}

function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);
        files.forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

function build() {
    console.log('[build] Starting build process...');

    // 1. Compile CSS
    console.log('[build] Compiling CSS...');
    execSync('npm run build:css', { stdio: 'inherit' });

    // 2. Clean dist
    cleanDist();

    // 3. Copy files
    console.log('[build] Copying files to dist...');
    FILES_TO_COPY.forEach(file => {
        const srcPath = path.join(__dirname, '..', file);
        const destPath = path.join(DIST_DIR, file);

        if (fs.existsSync(srcPath)) {
            copyRecursive(srcPath, destPath);
            console.log(`[build] Copied: ${file}`);
        } else {
            console.warn(`[build] Warning: ${file} not found, skipping.`);
        }
    });

    console.log('[build] Build successful! Output in ./dist');
}

build();
