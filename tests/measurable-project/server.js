const http = require('http');
const port = 3000;
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './static/index.html'));

const requestHandler = (req, res) => {
  if (req.url === '/') {
    res.end(html);
  } else {
    const filePath = `./static${req.url}`;
    const file = fs.existsSync(filePath) ? fs.readFileSync(filePath) : '';

    res.end(file);
  }
};

module.exports = () => {
  const server = http.createServer(requestHandler);

  return server.listen(port);
};
