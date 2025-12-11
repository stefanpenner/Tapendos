#!/usr/bin/env bun

import { transformSync } from '@babel/core';
import htmPlugin from 'babel-plugin-htm';

const port = process.env.PORT || 3000;

// Function to transform files with htm precompilation
function transformFile(filePath, content) {
  // Check if file uses html templates (check for html` or html\` patterns)
  if (!content.includes('html`') && !content.match(/html\s*`/)) {
    return content; // No htm templates, skip transformation
  }
  
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
  if (transformed !== content && transformed.includes('h(') && !transformed.match(/import.*h.*from.*preact/)) {
    transformed = `import { h } from 'preact';\n${transformed}`;
  }
  
  return transformed;
}

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Serve index.html for root
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // Try to serve the file
    const file = Bun.file(`.${pathname}`);
    if (await file.exists()) {
      let content = await file.text();
      
      // Precompile htm templates for .js and .mjs files
      if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
        // Skip node_modules - they're already compiled
        if (!pathname.includes('/node_modules/')) {
          content = transformFile(pathname, content);
        }
      }
      
      const response = new Response(content);
      // Set correct MIME types
      if (pathname.endsWith('.html')) {
        response.headers.set('Content-Type', 'text/html');
      } else if (pathname.endsWith('.css')) {
        response.headers.set('Content-Type', 'text/css');
      } else if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
        response.headers.set('Content-Type', 'application/javascript');
      } else if (pathname.endsWith('.svg')) {
        response.headers.set('Content-Type', 'image/svg+xml');
      } else if (pathname.endsWith('.png')) {
        response.headers.set('Content-Type', 'image/png');
      } else if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
        response.headers.set('Content-Type', 'image/jpeg');
      } else if (pathname.endsWith('.webp')) {
        response.headers.set('Content-Type', 'image/webp');
      }
      return response;
    }

    // 404
    return new Response('Not Found', { status: 404 });
  },
  error(error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Try a different port:`);
      console.error(`   PORT=3001 bun run dev`);
      process.exit(1);
    }
    return new Response('Internal Server Error', { status: 500 });
  },
});

console.log(`🚀 Dev server running at http://localhost:${server.port}`);

