'use strict';

var webServer = require('./web-server.js');
var configuration = require('./configuration.js');
var tools = require('./tools.js');
var fs = require('fs');

var saltList = [];

function server(eventEmitter, port, options) {
	if (typeof port !== 'number') {
		port = 8000;
	}
    webServer.handleRequest = router;
    webServer.createServer(port, options);

    function router(req, res, servlet) {
    	var pathName = req.url.pathname;
        var query = req.url.query;
        var method = req.method;
        var httpBody = req.httpBody;
        var path, index, data, salt, challenge, name, type, file;

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
                                canWriteFile: file.canWriteFile,
                                shortPath: file.shortPath,
                            };
                        });
                        servlet.sendHTML_(req, res, JSON.stringify(data), 200);
                    } else {
                        servlet.sendHTML_(req, res, 'An error occurs while parsing', 500);
                    }
                });
                return;
            case '/getSalt':
                salt = generateSalt();
                if (salt) {
                    servlet.sendHTML_(req, res, salt, 200);
                } else {
                    servlet.sendHTML_(req, res, 'Too much salt are currently used. Please retry in few moment.', 500);
                }
                return;
            case '/getCode':
                salt = query && query.salt;
                challenge = query && query.challenge;
                name = query && query.item;
                index = configuration.currentConf;

                if (!name) {
                    servlet.sendHTML_(req, res, 'Which item do you want to read?', 403);
                    return;
                }
                /* check if name exists and is allowed to required */
                file = configuration.getFile(name, index);
                if (!file) {
                    servlet.sendHTML_(req, res, 'This item is not available', 403);
                    return;
                }

                if (file.type) {
                    type = configuration.getType(file.type.name, index);
                }
                if (type && checkRight(type, 'readFile', salt, challenge)) {
                    data = readFile(file.path, type);
                    if (!data) {
                        servlet.sendHTML_(req, res, 'Cannot access the file', 500);
                        return;
                    }
                    servlet.sendHTML_(req, res, data, 200);
                } else {
                    servlet.sendHTML_(req, res, 'You cannot access this file.', 403);
                }
                return;
            case '/writeCode':
                salt = query && query.salt;
                challenge = query && query.challenge;
                name = query && query.item;
                index = configuration.currentConf;

                if (!name) {
                    servlet.sendHTML_(req, res, 'Which item do you want to write?', 403);
                    return;
                }
                if (!httpBody) {
                    servlet.sendHTML_(req, res, 'What do you want to write?', 500);
                    return;
                }

                /* check if name exists and is allowed to required */
                file = configuration.getFile(name, index);
                if (!file) {
                    servlet.sendHTML_(req, res, 'This item is not available', 403);
                    return;
                }

                if (file.type) {
                    type = configuration.getType(file.type.name, index);
                }
                if (type && checkRight(type, 'writeFile', salt, challenge)) {
                    data = writeFile(file.path, httpBody, type);
                    if (!data) {
                        servlet.sendHTML_(req, res, 'Cannot access the file', 500);
                        return;
                    }
                    servlet.sendHTML_(req, res, 'OK', 200);
                } else {
                    servlet.sendHTML_(req, res, 'You cannot access this file.', 403);
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

function checkSalt(salt, challenge) {
    var password = configuration._password;
    var realChlg;

    if (!password || !salt || !challenge || saltList.indexOf(salt) === -1) {
        return false;
    }

    realChlg = tools.generateChallenge(salt, password);

    if (realChlg !== challenge) {
        return false;
    }

    removeSalt(salt);
    return true;
}

function checkRight(type, property, salt, challenge) {
    return type.rights[property] === true
        || (type.rights[property] === 'password' && checkSalt(salt, challenge));
}

function readFile(filePath, type) {
    var data;
    try {
        data = fs.readFileSync(filePath, {
            encoding: 'utf8'
        });
    } catch(e) {
        return;
    }

    return data;
}

function writeFile(filePath, data, type) {
    var isOk = false;

    try {
        fs.writeFileSync(filePath, data, {
            encoding: 'utf8'
        });
        isOk = true;
    } catch(e) {
        isOk = false;
    }

    return isOk;
}

exports.server = server;
