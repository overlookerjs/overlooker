const http = require('http');
const port = 3000;
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const requestHandler = (req, res) => {
  if (req.url === '/') {
    const html = fs.readFileSync(path.resolve(__dirname, './../static/index.html'));

    res.end(html);
  } else {
    const filePath = path.resolve(__dirname, `./../static${req.url}`);
    const file = fs.existsSync(filePath) ? fs.readFileSync(filePath) : '';

    res.setHeader('content-type', mime.lookup(filePath));
    res.end(file);
  }
};

module.exports = () => {
  const server = http.createServer(requestHandler);

  return server.listen(port);
};
