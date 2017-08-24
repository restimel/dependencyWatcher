'use strict';

var webServer = require('./web-server.js');
var configuration = require('./configuration.js');
var tools = require('./tools.js');
var fs = require('fs');

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
                    servlet.sendHTML_(req, res, 'Which item do you want to read?', 404);
                    return;
                }
                /* check if name exist and is allowed to required */
                file = configuration.getFile(name, index);
                if (!file) {
                    servlet.sendHTML_(req, res, 'This item is not available', 404);
                    return;
                }

                if (file.type) {
                    type = configuration.getType(file.type.name, index);
                }
                if (type && checkRight(type, 'readFile', salt, challenge)) {
                    data = cipher(file.path, type);
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
                    servlet.sendHTML_(req, res, 'Which item do you want to write?', 404);
                    return;
                }
                if (!httpBody) {
                    servlet.sendHTML_(req, res, 'What do you want to write?', 500);
                }

                /* check if name exist and is allowed to required */
                file = configuration.getFile(name, index);
                if (!file) {
                    servlet.sendHTML_(req, res, 'This item is not available', 404);
                    return;
                }

                if (file.type) {
                    type = configuration.getType(file.type.name, index);
                }
                if (type && checkRight(type, 'writeFile', salt, challenge)) {
                    data = decipher(file.path, httpBody, type);
                    if (!data) {
                        servlet.sendHTML_(req, res, 'Cannot access the file', 500);
                        return;
                    }
                    servlet.sendHTML_(req, res, data, 200);
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

function cipher(filePath, type) {
    var data = fs.readFileSync(filePath, {
        encoding: 'utf8'
    });

    if (data && type.rights.readFile === 'password') {
        data = tools.cipher(data, configuration._password);
    }

    return data;
}

function decipher(filePath, data, type) {
    /* TODO all */

    if (data && type.rights.readFile === 'password') {
        data = tools.decipher(data, configuration._password);
    }

    var logger = require('./logger.js');
    logger.error(data);
    // var file = fs.readFileSync(filePath, {
    //     encoding: 'utf8'
    // });

    return data;
}

exports.server = server;
