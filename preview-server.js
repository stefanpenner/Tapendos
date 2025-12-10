#!/usr/bin/env bun

const port = process.env.PORT || 8080;

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Serve index.html for root
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // Try to serve the file from dist directory
    const file = Bun.file(`./dist${pathname}`);
    if (await file.exists()) {
      const response = new Response(file);
      // Set correct MIME type for JavaScript modules
      if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
        response.headers.set('Content-Type', 'application/javascript');
      }
      return response;
    }

    // 404
    return new Response('Not Found', { status: 404 });
  },
  error(error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Try a different port:`);
      console.error(`   PORT=8081 bun run preview`);
      process.exit(1);
    }
    return new Response('Internal Server Error', { status: 500 });
  },
});

console.log(`🚀 Preview server running at http://localhost:${server.port}`);
console.log(`   Serving files from ./dist/`);

