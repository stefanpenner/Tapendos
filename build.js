import { mkdir, copyFile, readdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

// Create dist directory
if (!existsSync('dist')) {
  await mkdir('dist', { recursive: true });
}

// Bundle the main entry point using Bun.build() API
const result = await Bun.build({
  entrypoints: ['./main.js'],
  outdir: './dist',
  target: 'browser',
  minify: true,
});

if (!result.success) {
  console.error('Build failed:', result.logs);
  process.exit(1);
}

// Copy HTML and CSS files
await copyFile('index.html', 'dist/index.html');
await copyFile('styles.css', 'dist/styles.css');

// Update index.html to reference the bundled file
const htmlContent = await readFile('dist/index.html', 'utf-8');
const distFiles = await readdir('dist');
const jsFile = distFiles.find(f => f.endsWith('.js') && f.startsWith('main'));
if (jsFile) {
  const updatedHtml = htmlContent.replace('./main.js', `./${jsFile}`);
  await writeFile('dist/index.html', updatedHtml);
}

console.log('✓ Build complete! Output in dist/');

