const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs').promises;

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const PUBLIC_DIR = path.join(__dirname, '');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

server.use(async (req, res, next) => {
  let urlPath = req.url.split('?')[0];

  if (
    urlPath.match(/^\/products(\/[0-9]+)?$/) || 
    urlPath.match(/^\/users(\/[0-9]+)?$/) ||
    urlPath.match(/^\/cart(\/[0-9]+)?$/) ||
    urlPath.match(/^\/purchased(\/[0-9]+)?$/) ||
    urlPath.match(/^\/api(\/.*)?$/)
  ) {
    console.log(`[${new Date().toISOString()}] Passing API request: ${req.method} ${urlPath}`);
    return next();
  }

  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'home/index.html' : urlPath);
  console.log(`[${new Date().toISOString()}] Trying to serve file: ${filePath}`);

  if (!path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }

  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  try {
    const content = await fs.readFile(filePath);
    console.log(`[${new Date().toISOString()}] File found: ${filePath}`);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error serving ${filePath}: ${error.message}`);
    try {
      const notFoundPath = path.join(PUBLIC_DIR, 'page_404', '404.html');
      const notFoundContent = await fs.readFile(notFoundPath);
      console.log(`[${new Date().toISOString()}] Serving 404 page: ${notFoundPath}`);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(notFoundContent);
    } catch (notFoundError) {
      console.error(`[${new Date().toISOString()}] Error serving 404 page: ${notFoundError.message}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

server.use(router);

server.listen(3000, () => {
  console.log('JSON Server running at http://localhost:3000');
});