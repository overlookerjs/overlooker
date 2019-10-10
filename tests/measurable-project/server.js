const http = require('http');
const port = 3000;
const fs = require('fs');
const path = require('path');

const requestHandler = (html) => (req, res) => {
  if (req.url === '/') {
    res.end(html);
  } else {
    const filePath = `./static${req.url}`;
    const file = fs.existsSync(filePath) ? fs.readFileSync(filePath) : '';

    res.end(file);
  }
};

module.exports = () => {
  const html = fs.readFileSync(path.resolve(__dirname, './static/index.html'));

  const server = http.createServer(requestHandler(html));

  return server.listen(port);
};
