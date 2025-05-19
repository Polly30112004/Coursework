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

    // Пропускаем API-запросы только если нет расширения файла
    const urlPath = req.url.split('?')[0];
    if (
        (urlPath.startsWith('/products') ||
         urlPath.startsWith('/users') ||
         urlPath.startsWith('/cart') ||
         urlPath.startsWith('/api')) &&
        !path.extname(urlPath)
    ) {
        console.log('Передаём запрос JSON Server:', urlPath);
        return next();
    }

    // Нормализуем путь
    let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'home/index.html' : urlPath);
    console.log('Пытаемся обслужить файл:', filePath); // Диагностика

    // Если путь заканчивается на папку, пробуем найти index.html
    if (!path.extname(filePath)) {
        filePath = path.join(filePath, 'index.html');
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    try {
        const content = await fs.readFile(filePath);
        console.log('Файл найден, отправляем:', filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (error) {
        console.error(`Ошибка обслуживания ${filePath}:`, error.message);
        try {
            const notFoundPath = path.join(PUBLIC_DIR, 'page_404/404.html');
            const notFoundContent = await fs.readFile(notFoundPath);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(notFoundContent);
        } catch (notFoundError) {
            console.error('Ошибка обслуживания 404:', notFoundError.message);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
    }
});

server.use(router);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});