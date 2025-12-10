import { mkdir, copyFile, readdir, readFile, writeFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { transformSync } from '@babel/core';
import htmPlugin from 'babel-plugin-htm';

// Create dist directory
if (!existsSync('dist')) {
  await mkdir('dist', { recursive: true });
}

// Function to transform files with htm precompilation
function transformFile(filePath, content) {
  // Transform htm templates using babel-plugin-htm
  const result = transformSync(content, {
    filename: filePath,
    plugins: [
      [htmPlugin, { 
        pragma: 'h',
        tag: 'html'
      }]
    ],
    retainLines: false,
    compact: false,
  });
  
  let transformed = result?.code || content;
  
  // If the file was transformed and uses h(), ensure h is imported
  if (transformed !== content && transformed.includes('h(') && !transformed.includes("import { h }") && !transformed.includes('from "preact"') && !transformed.includes("from 'preact'")) {
    // Add import for h if not already present
    if (!transformed.includes('import') || !transformed.match(/import.*h.*from.*preact/)) {
      transformed = `import { h } from 'preact';\n${transformed}`;
    }
  }
  
  return transformed;
}

// Precompile all source files before bundling
async function precompileFiles(dir = '.', outputDir = 'dist/.precompiled') {
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
  
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = join(dir, file.name);
    
    // Skip node_modules, dist, .git, etc.
    if (file.name.startsWith('.') || 
        file.name === 'node_modules' || 
        file.name === 'dist' ||
        file.name === 'build.js' ||
        file.name === 'dev-server.js' ||
        file.name === 'dev.js') {
      continue;
    }
    
    if (file.isDirectory()) {
      await precompileFiles(fullPath, join(outputDir, file.name));
    } else if (file.name.endsWith('.mjs') || file.name.endsWith('.js')) {
      const content = await Bun.file(fullPath).text();
      const transformed = transformFile(fullPath, content);
      const outputPath = join(outputDir, file.name);
      await writeFile(outputPath, transformed);
    }
  }
}

// Precompile files first
console.log('Precompiling htm templates...');
await precompileFiles('.', 'dist/.precompiled');

// Update main.js to point to precompiled version (already done in precompileFiles)

// Bundle the precompiled main entry point
const result = await Bun.build({
  entrypoints: ['./dist/.precompiled/main.js'],
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

// Update index.html to reference the bundled file and remove import map
const htmlContent = await readFile('dist/index.html', 'utf-8');
const distFiles = await readdir('dist');
const jsFile = distFiles.find(f => f.endsWith('.js') && f.startsWith('main'));
let updatedHtml = htmlContent;

// Remove the import map since everything is bundled
updatedHtml = updatedHtml.replace(
  /<script type="importmap">[\s\S]*?<\/script>\s*/,
  ''
);

// Update script reference to bundled file
if (jsFile) {
  updatedHtml = updatedHtml.replace('./main.js', `./${jsFile}`);
}

await writeFile('dist/index.html', updatedHtml);

// Clean up temporary precompiled directory
import { rm } from 'fs/promises';
if (existsSync('dist/.precompiled')) {
  await rm('dist/.precompiled', { recursive: true, force: true });
}

console.log('✓ Build complete! Output in dist/');

