'use strict';

var webServer = require('./web-server.js');
var config = require('./configuration.js');

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
        var path;

        switch (pathName) {
            case '/logout':
            case '/exit':
            	servlet.sendHTML_(req, res, 'The program has been shutdown.<script>window.close();</script>', 202);
                process.exit();
            case '/':
            	path = './pages/index.html';
            	break;
            case '/data/links.json':
                if (query.parse === 'true') {
                    eventEmitter.emit('parseFiles', function(err) {
                        if (err) {
                            servlet.sendHTML_(req, res, err.toString(), 500);
                        } else {
                            servlet.sendFile_(req, res, path);
                        }
                    });
                    return;
                }
                break;
            case '/TODO.js':
                servlet.sendHTML_(req, res,config.buildPage(), 200);
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
}

exports.server = server;
