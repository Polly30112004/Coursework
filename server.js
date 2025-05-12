const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs').promises;

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname);

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

server.use(middlewares);

// Обработка статических файлов и 404
server.use(async (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // Пропускаем API-запросы
    if (req.url.startsWith('/products') || req.url.startsWith('/api')) {
        return next();
    }

    // Нормализуем путь
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'home/index.html' : req.url);

    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    try {
        const content = await fs.readFile(filePath);
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

server.use(router);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});