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

var version = '0.5.0';

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

    parser.addArgument('configuration', {
        help: 'Define the path of the configuration file (by default, it reads configuration.json)',
        nargs: '?',
        defaultValue: './configuration.json',
        metavar: '<configuration_file>'
    });

    var args = parser.parseArgs();

    changePort(args.port);
    configuration.verbose = args.verbose;
    configurationPath = args.configuration;
}

function changePort(port) {
    var portNb = Number(port);
    if (isNaN(portNb) || portNb > 65535 || portNb < 0 || portNb%1 !== 0) {
        console.error('Port number "%s" is invalid. Please enter a valid port number.', port);
        process.exit(1);
    }

    serverPort = portNb;
}

function startProcess() {
    parser = new Parser(eventEmitter);

    web.server(eventEmitter, serverPort);

    eventEmitter.addListener('parseFiles', parseFiles);
}

function parseFiles(callback) {
    if (typeof callback === 'function') {
        eventEmitter.once('parsed:parser', callback);
    }

    logger.trace('parseFiles');

    parser.parse();
}

/* run script */
main();
