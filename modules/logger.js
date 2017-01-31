'use strict';

var fs = require('fs');
var configuration = require('./configuration.js');

var loggerPath;
var logLevel = 0;

function checkPath() {
	if (typeof loggerPath === 'undefined') {
		loggerPath = configuration.log;
	}

	return !!loggerPath;
}

function log(message, level) {
	var timestamp, text, hasLog;
	
	hasLog = checkPath();
	if (!hasLog && !configuration.verbose) {
		return;
	}
	
	level = level || 0;

	timestamp = Date.now();
	text = '[' + timestamp + '] - ' + message + '\n';

	if (configuration.verbose) {
		console.log(text);
	}
	if (!hasLog || level < logLevel) {
		return;
	}
	fs.appendFile(loggerPath, text, {
		flags: 'a',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, function(err) {
		if (err) {
			console.warn('Error while writing log file "' + loggerPath + '".', err);
		}
	});
};

function debug(message) {
	log(message, 0);
}

function trace(message) {
	log(message, 1);
}

function info(message) {
	log(message, 2);
}

function warn(message) {
	log(message, 3);
	console.warn(message);
}

function error(message) {
	log(message, 4);
	console.error(message);
}

exports.init = function() {
	if (!checkPath()) {
		return;
	}

	fs.writeFile(loggerPath, '', {
		flags: 'w',
		defaultEncoding: 'utf8',
		mode: parseInt('666', 8)
	}, function(err) {
		if (err) {
			console.warn('Error while writing log file "' + loggerPath + '".', err);
		}
	});

	log('Starting...');
};

exports.log = log;
exports.debug = debug;
exports.trace = trace;
exports.info = info;
exports.warn = warn;
exports.error = error;
