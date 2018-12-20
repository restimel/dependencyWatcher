#!/usr/bin/env node

var util = require('util');
var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var events = require('events');
var logger = require('./logger.js');

var DEFAULT_PORT = 8000;

/* To generate cert with open SSL in dev mode
 * openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
 */

function createServer(port, options) {
  new HttpServer({
    'GET': createServlet(StaticServlet),
    'HEAD': createServlet(StaticServlet),
    'PUT': createServlet(StaticServlet),
    'POST': createServlet(StaticServlet),
    'DELETE': createServlet(StaticServlet)
  }, options).start(Number(port) || DEFAULT_PORT);
}

function escapeHtml(value) {
  return value.toString().
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;').
    replace(/"/g, '&quot;');
}

function createServlet(Class) {
  var servlet = new Class();
  return servlet.handleRequest.bind(servlet);
}

/**
 * An Http server implementation that uses a map of methods to decide
 * action routing.
 *
 * @param {Object} Map of method => Handler function
 * @param {Object} Options as key and cert to define certificate
 */
function HttpServer(handlers, options) {
  var key, cert;
  this.handlers = handlers;

  if (options.key) {
    key = fs.readFileSync(options.key);
  }

  if (options.cert) {
    cert = fs.readFileSync(options.cert);
  }

  if (key && cert) {
    this.server = https.createServer({
      key: key,
      cert: cert,
    }, this.handleRequest_.bind(this));
    this.protocol = 'https';
  } else {
    this.server = http.createServer(this.handleRequest_.bind(this));
    this.protocol = 'http';
  }
}

HttpServer.prototype.start = function(port) {
  var message;

  this.port = port;
  try {
    this.server.listen(port);
  } catch(e) {
    logger.error(port + ' is already in used.');
    return;
  }
  message = 'Web Server running at ' + this.protocol + '://localhost:' + port + '/';
  logger.info(message);
  console.log(message);
};

HttpServer.prototype.parseUrl_ = function(urlString) {
  var parsed = url.parse(urlString);
  parsed.pathname = url.resolve('/', parsed.pathname);
  return url.parse(url.format(parsed), true);
};

HttpServer.prototype.handleRequest_ = function(req, res) {
  var body;
  var logEntry = req.method + ' ' + req.url;
  if (req.headers['user-agent']) {
    logEntry += ' ' + req.headers['user-agent'];
  }

  logger.trace(logEntry);
  req.url = this.parseUrl_(req.url);
  var handler = this.handlers[req.method];
  if (!handler) {
    res.writeHead(501);
    res.end();
  } else {
    if (req.method === 'POST' || req.method === 'PUT') {
      body = '';
      handler = handler.bind(this);

      req.on('data', function(chunk) {
        body += chunk.toString();
      });

      req.on('end', function() {
        req.httpBody = body;
        handler(req, res);
      });
    } else {
      handler.call(this, req, res);
    }
  }
};

/**
 * Handles static content.
 */
function StaticServlet() {}

StaticServlet.MimeMap = {
  'txt': 'text/plain',
  'html': 'text/html',
  'css': 'text/css',
  'xml': 'application/xml',
  'json': 'application/json',
  'js': 'application/javascript',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'png': 'image/png',
  'svg': 'image/svg+xml'
};

StaticServlet.prototype.handleRequest = function(req, res) {
  if (typeof module.exports.handleRequest === 'function') {
    return module.exports.handleRequest(req, res, this);
  }

  var path = ('./' + req.url.pathname).replace('//','/').replace(/%(..)/g, function(match, hex){
    return String.fromCharCode(parseInt(hex, 16));
  });

  var parts = path.split('/');
  if (parts[parts.length-1].charAt(0) === '.') {
    return this.sendForbidden_(req, res, path);
  }

  fs.stat(path, function(err, stat) {
    if (err) {
      return this.sendMissing_(req, res, path);
    }
    if (stat.isDirectory()) {
      return this.sendDirectory_(req, res, path);
    }
    return this.sendFile_(req, res, path);
  }.bind(this));
}

StaticServlet.prototype.sendError_ = function(req, res, error) {
  res.writeHead(500, {
      'Content-Type': 'text/html'
  });
  res.write('<!doctype html>\n');
  res.write('<title>Internal Server Error</title>\n');
  res.write('<h1>Internal Server Error</h1>');
  res.write('<pre>' + escapeHtml(util.inspect(error)) + '</pre>');
  logger.warn('500 Internal Server Error');
  logger.error(util.inspect(error));
};

StaticServlet.prototype.sendMissing_ = function(req, res, path) {
  path = path.substring(1);
  res.writeHead(404, {
      'Content-Type': 'text/html'
  });
  res.write('<!doctype html>\n');
  res.write('<title>404 Not Found</title>\n');
  res.write('<h1>Not Found</h1>');
  res.write(
    '<p>The requested URL ' +
    escapeHtml(path) +
    ' was not found on this server.</p>'
  );
  res.end();
  logger.info('404 Not Found: ' + path);
};

StaticServlet.prototype.sendForbidden_ = function(req, res, path) {
  path = path.substring(1);
  res.writeHead(403, {
      'Content-Type': 'text/html'
  });
  res.write('<!doctype html>\n');
  res.write('<title>403 Forbidden</title>\n');
  res.write('<h1>Forbidden</h1>');
  res.write(
    '<p>You do not have permission to access ' +
    escapeHtml(path) + ' on this server.</p>'
  );
  res.end();
  logger.warn('403 Forbidden: ' + path);
};

StaticServlet.prototype.sendRedirect_ = function(req, res, redirectUrl) {
  res.writeHead(301, {
      'Content-Type': 'text/html',
      'Location': redirectUrl
  });
  res.write('<!doctype html>\n');
  res.write('<title>301 Moved Permanently</title>\n');
  res.write('<h1>Moved Permanently</h1>');
  res.write(
    '<p>The document has moved <a href="' +
    redirectUrl +
    '">here</a>.</p>'
  );
  res.end();
  logger.trace('301 Moved Permanently: ' + redirectUrl);
};

StaticServlet.prototype.sendHTML_ = function(req, res, html, code) {
  code = code || 200;

  res.writeHead(code, {
      'Content-Type': 'text/html'
  });
  res.write(html);
  res.end();
};

StaticServlet.prototype.sendFile_ = function(req, res, path) {
  var that = this;
  var file = fs.createReadStream(path);
  res.writeHead(200, {
    'Content-Type': StaticServlet.
      MimeMap[path.split('.').pop()] || 'text/plain'
  });
  if (req.method === 'HEAD') {
    res.end();
  } else {
    file.on('data', res.write.bind(res));
    file.on('close', function() {
      res.end();
    });
    file.on('error', function(error) {
      if (error.errno === -2) {
        that.sendMissing_(req, res, error.path);
      } else {
        that.sendError_(req, res, error);
      }
    });
  }
};

StaticServlet.prototype.sendDirectory_ = function(req, res, path) {
  var that = this;
  if (path.match(/[^\/]$/)) {
    req.url.pathname += '/';
    var redirectUrl = url.format(url.parse(url.format(req.url)));
    return that.sendRedirect_(req, res, redirectUrl);
  }
  fs.readdir(path, function(err, files) {
    if (err) {
      if (err.errno === -2) {
        return that.sendMissing_(req, res, err.path);
      } else {
        return that.sendError_(req, res, err);
      }
    }

    if (!files.length) {
      return that.writeDirectoryIndex_(req, res, path, []);
    }

    var remaining = files.length;
    files.forEach(function(fileName, index) {
      fs.stat(path + '/' + fileName, function(err, stat) {
        if (err)
          return that.sendError_(req, res, err);
        if (stat.isDirectory()) {
          files[index] = fileName + '/';
        }
        if (!(--remaining))
          return that.writeDirectoryIndex_(req, res, path, files);
      });
    });
  });
};

StaticServlet.prototype.writeDirectoryIndex_ = function(req, res, path, files) {
  path = path.substring(1);
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.write('<!doctype html>\n');
  res.write('<title>' + escapeHtml(path) + '</title>\n');
  res.write('<style>\n');
  res.write('  ol { list-style-type: none; font-size: 1.2em; }\n');
  res.write('</style>\n');
  res.write('<h1>Directory: ' + escapeHtml(path) + '</h1>');
  res.write('<ol>');
  files.forEach(function(fileName) {
    if (fileName.charAt(0) !== '.') {
      res.write('<li><a href="' +
        escapeHtml(fileName) + '">' +
        escapeHtml(fileName) + '</a></li>');
    }
  });
  res.write('</ol>');
  res.end();
};

exports.createServer = createServer;
// exports.handleResponse =
