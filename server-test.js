import http from 'http';

// Funkcja pomocnicza do asynchronicznego parsowania JSON
async function parseRequestBody(req) {
    let body = '';
    for await (const chunk of req) {
        body += chunk;
    }
    return JSON.parse(body);
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        if (req.method === 'GET' && req.url === '/api') {
            const data = { message: 'Hello, this is JSON response!' };
            res.statusCode = 200;
            res.end(JSON.stringify(data));

        } else if (req.method === 'POST' && req.url === '/api') {
            const parsedData = await parseRequestBody(req);
            console.log('Received:', parsedData);

            res.statusCode = 200;
            res.end(JSON.stringify({ status: 'Success', received: parsedData }));

        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
});

server.listen(3000, () => {
    console.log('API running at http://localhost:3000/api');
});
