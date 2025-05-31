const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const jsonServer = require('json-server');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname);
const DB_FILE = path.join(__dirname, 'db.json');

// MIME types
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

// Настройка json-server только для API
const jsonServerApp = jsonServer.create();
const router = jsonServer.router(DB_FILE);
const jsonServerMiddlewares = jsonServer.defaults({ noCors: true }); // Отключаем CORS, чтобы минимизировать влияние Express
jsonServerApp.use(jsonServerMiddlewares);
jsonServerApp.use(router);

// Создаем HTTP-сервер
const server = http.createServer(async (req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    const urlPath = req.url.split('?')[0];
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Перенаправляем API-запросы в json-server
    if (
        (pathname.startsWith('/products') ||
         pathname.startsWith('/users') ||
         pathname.startsWith('/cart') ||
         pathname.startsWith('/purchased') ||
         pathname.startsWith('/api')) &&
        !path.extname(pathname)
    ) {
        console.log('Passing request to JSON Server:', pathname);
        // Перенаправляем запрос в json-server
        jsonServerApp.handle(req, res);
        return;
    }

    // Обслуживание статических файлов (без использования Express)
    let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'home/index.html' : urlPath);
    console.log('Trying to serve file:', filePath);

    if (!path.extname(filePath)) {
        filePath = path.join(filePath, 'index.html');
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    try {
        const content = await fs.readFile(filePath);
        console.log('File found, sending:', filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (error) {
        console.error(`Error serving ${filePath}:`, error.message);
        try {
            const notFoundPath = path.join(PUBLIC_DIR, 'page_404/404.html');
            const notFoundContent = await fs.readFile(notFoundPath);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(notFoundContent);
        } catch (notFoundError) {
            console.error('Error serving 404:', notFoundError.message);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});