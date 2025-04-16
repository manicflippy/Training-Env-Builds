const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Create server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle static file requests
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
        serveFile(res, 'index.html', 'text/html');
    } else if (req.method === 'GET' && pathname === '/styles.css') {
        serveFile(res, 'styles.css', 'text/css');
    } else if (req.method === 'GET' && pathname === '/script.js') {
        serveFile(res, 'script.js', 'text/javascript');
    } 
    // Handle API requests
    else if (req.method === 'POST' && pathname === '/api/save') {
        let body = '';
        
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { filename, content } = data;
                
                if (!filename || !content) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Missing filename or content' }));
                    return;
                }
                
                // Sanitize filename to prevent directory traversal
                const sanitizedFilename = path.basename(filename);
                const filePath = path.join(__dirname, 'saved-content', sanitizedFilename);
                
                // Write the file
                fs.writeFile(filePath, content, (err) => {
                    if (err) {
                        console.error('Error saving file:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Error saving file' }));
                        return;
                    }
                    
                    console.log(`File saved: ${filePath}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'File saved successfully',
                        path: filePath
                    }));
                });
            } catch (error) {
                console.error('Error parsing request:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON data' }));
            }
        });
    } 
    // Handle API to list saved files
    else if (req.method === 'GET' && pathname === '/api/list') {
        const dirPath = path.join(__dirname, 'saved-content');
        
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Error reading directory' }));
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                files: files.map(file => ({
                    name: file,
                    path: `/saved-content/${file}`
                }))
            }));
        });
    }
    // Serve saved content
    else if (req.method === 'GET' && pathname.startsWith('/saved-content/')) {
        const filename = path.basename(pathname);
        const filePath = path.join(__dirname, 'saved-content', filename);
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

function serveFile(res, filename, contentType) {
    fs.readFile(path.join(__dirname, filename), (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Saved content will be stored in: ${path.join(__dirname, 'saved-content')}`);
});
