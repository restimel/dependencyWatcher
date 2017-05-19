'use strict';

var webServer = require('./web-server.js');
var configuration = require('./configuration.js');

function server(eventEmitter, port) {
	if (typeof port !== 'number') {
		port = 8000;
	}
    webServer.handleRequest = router;
    webServer.createServer(port);

    function router(req, res, servlet) {
    	var pathName = req.url.pathname;
        var query = req.url.query;
        var method = req.method;
        var httpBody = req.httpBody;
        var path, index;

        switch (pathName) {
            case '/logout':
            case '/exit':
            	servlet.sendHTML_(req, res, 'The program has been shutdown.<script>window.close();</script>', 202);
                process.exit();
            case '/':
            	path = './pages/index.html';
            	break;
            case '/data/configuration.json':
                servlet.sendHTML_(req, res, getWebConfig(), 200);
                return;
            case '/data/links.json':
                index = query && query.configuration;
                eventEmitter.emit('parseFiles', index, function(parser) {
                    if (parser) {
                        servlet.sendHTML_(req, res, JSON.stringify(parser.files), 200);
                    } else {
                        servlet.sendHTML_(req, res, 'An error occurs while parsing', 500);
                    }
                });
                return;
            default:
            	pathName = pathName.replace(/^([^\/])/, '/$1').replace(/\/\.*\//g, '/');
            	path = './pages' + pathName;
        }

        if (/\/$/.test(path)) {
        	servlet.sendDirectory_(req, res, path);
        } else {
        	servlet.sendFile_(req, res, path);
        }
    }

    function getWebConfig() {
        var config = {};

        config.dependencies = configuration.configuration.map(function(conf) {
            return conf.name;
        });

        return JSON.stringify(config);
    }
}

exports.server = server;
