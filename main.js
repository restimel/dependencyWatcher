#!/usr/bin/env node
'use strict';

var events = require('events');
var configuration = require('./modules/configuration.js');
var web = require('./modules/web-router.js');
var Parser = require('./modules/parser.js');
var logger = require('./modules/logger.js');

var eventEmitter;
var parser;

var version = '1.0.0';

/* port number */
var serverPort = 8000;
var configurationPath = '';

/**
 * the main entry point of the program
 * @param {String[]} argv list of arguments given my STDIN
 *
 * node main.js [path to configuration.js]
 */
function main(argv) {
    params(argv);

    configuration.readConfig(configurationPath);
    eventEmitter = new events.EventEmitter();
    startProcess();
}

function params(argv) {
    var args = argv.slice(2);
    var arg, value;

    while (args.length) {
        arg = args.shift();

        if (['-h', '--help'].indexOf(arg) !== -1) {
            console.log(command_help());
            process.exit(0);
        }

        if (['-v', '--version'].indexOf(arg) !== -1) {
            console.log('i18n-js-parser v' + version);
            process.exit(0);
        }

        if (arg.indexOf('--port=') === 0) {
            changePort(arg.slice(7));
            continue;
        }

        if (['-p', '--port'].indexOf(arg) !== -1) {
            changePort(args.shift());
        }

        if (arg == '--verbose') {
            configuration.verbose = true;
        }

        // In other cases it should be the path of configuration file
        if (arg.indexOf('-') !== 0) {
            configurationPath = arg;
        }
    }
}

function command_help() {
    var text = [
        'syntax:',
        '\t node main.js [-h|--help][-v|--version][(-p|--port) <port>][--verbose][ <configurationFile>]',
        '',
        '-v (or --version): to know the current version of i18n-js-parser',
        '-h (or --help): to have a quick summary of available options',
        '-p (or --port): set the port of webserver (by default it uses port 8000)',
        '--verbose: display also all logs in terminal',
    ];

    return text.join('\n');
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
main(process.argv);
