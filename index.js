#!/usr/bin/env node
'use strict';

var events = require('events');
var configuration = require('./modules/configuration.js');
var web = require('./modules/web-router.js');
var Parser = require('./modules/parser.js');
var logger = require('./modules/logger.js');
var ArgumentParser = require('argparse').ArgumentParser;

var eventEmitter;
var parser;

var version = '0.6.0';

/* port number */
var serverPort = 8000;
var configurationPath = '';

/**
 * the main entry point of the program
 */
function main() {
    params();

    configuration.readConfig(configurationPath);
    eventEmitter = new events.EventEmitter();
    startProcess();
}

/* parse args and manage help */
function params() {
    var parser = new ArgumentParser({
        version: version,
        addHelp:true,
        description: 'Dependency watcher parses files defined in configuration file and build relationship. A web server is started where you can connect to watch dependencies. More information available at https://github.com/restimel/dependencyWatcher/blob/master/README.md'
    });

    parser.addArgument(['-p', '--port'], {
        help: 'Set the port of webserver (by default, it uses port 8000)',
        defaultValue: 8000,
        dest: 'port',
        type: 'int',
        metavar: '<port>'
    });

    parser.addArgument('--verbose', {
        help: 'Display also all logs in standard output',
        defaultValue: false,
        action: 'storeTrue',
        dest: 'verbose',
    });

    parser.addArgument('--logLevel', {
        help: 'Set the level of log (should be a number between 0 and 5)',
        defaultValue: undefined,
        dest: 'logLevel',
        type: 'int',
        metavar: '<L>'
    });

    parser.addArgument('configuration', {
        help: 'Define the path of the configuration file (by default, it reads configuration.json)',
        nargs: '?',
        defaultValue: './configuration.json',
        metavar: '<configuration_file>'
    });

    var args = parser.parseArgs();

    if (args.logLevel !== null) {
        configuration._logLevel = args.logLevel;
    }
    changePort(args.port);
    configuration.verbose = args.verbose;
    configurationPath = args.configuration;
}

function changePort(port) {
    var portNb = Number(port);
    if (isNaN(portNb) || portNb > 65535 || portNb < 0 || portNb%1 !== 0) {
        logger.error('Port number "' + port +'" is invalid. Please enter a valid port number.');
        process.exit(1);
    }

    serverPort = portNb;
}

function startProcess() {
    parser = new Parser(eventEmitter);

    web.server(eventEmitter, serverPort, {
        key: configuration.security.key,
        cert: configuration.security.cert,
    });

    eventEmitter.addListener('parseFiles', parseFiles);
}

function parseFiles(confIndex, callback) {
    logger.trace('parseFiles');

    if (typeof callback === 'function') {
        eventEmitter.once('parsed:parser', callback);
    }

    if (configuration.configuration[confIndex]) {
        logger.debug('change currentConf');
        configuration.currentConf = confIndex;
    }

    parser.parse();
}

/* run script */
main();
