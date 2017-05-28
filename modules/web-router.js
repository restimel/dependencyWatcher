'use strict';

var webServer = require('./web-server.js');
var configuration = require('./configuration.js');
var tools = require('./tools.js');

var saltList = [];

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
        var path, index, data;

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
                        data = parser.files.map(function(file) {
                            return {
                                name: file.name,
                                label: file.label,
                                dependencies: file.dependencies,
                                requiredBy: file.requiredBy,
                                type: file.type,
                                canReadFile: file.canReadFile,
                                canWriteFile: file.canWriteFile
                            };
                        });
                        servlet.sendHTML_(req, res, JSON.stringify(data), 200);
                    } else {
                        servlet.sendHTML_(req, res, 'An error occurs while parsing', 500);
                    }
                });
                return;
            case '/getSalt':
                data = generateSalt();
                if (data) {
                    servlet.sendHTML_(req, res, data, 200);
                } else {
                    servlet.sendHTML_(req, res, 'Too much salt are currently used. Please retry in few moment.', 500);
                }
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


function getWebConfig() {
    var config = {};

    config.dependencies = configuration.configuration.map(function(conf) {
        return conf.name;
    });

    return JSON.stringify(config);
}

function generateSalt() {
    var salt;

    if (saltList.length >= configuration.security.maxStoreSalt) {
        return false;
    }

    salt = tools.generateSalt();

    saltList.push(salt);
    setTimeout(removeSalt, 120000, salt);

    return salt;
}

function removeSalt(salt) {
    var idx = saltList.indexOf(salt);

    if (idx !== -1) {
        saltList.splice(idx, 1);
    }
}

exports.server = server;
