const Router = require('express');
const routes = new Router();  

const html = `
    <html>
    <header>
        <title>Servidor</title>
        <style>
            body {
                background-color: #202123;
                color: #fff;
            }
        </style>
    </header>
    <body>
        <center>
            <h1>* * * SERVIDOR SOCKET.IO * * *</h1>
            <hr>
            <h2>Socket On-Line</h2>
        </center>
    </body>
    </html>
`;

routes.post('/api/socket', function (req, res) {
    try {
        req.io.emit(req.body.evento, JSON.stringify(req.body.data));
        return res.status(200).json({ status: 200, message: 'Sucesso' });
    } catch (e) {
        return res.status(200).json({ status: 500, message: e.message });
    }
});


routes.get('/', function (req, res) {
    return res.status(200).send(html);
});

module.exports = routes;