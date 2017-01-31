'use strict';

var fs = require('fs');
var config = require('./configuration.js');
var FileReader = require('./fileReader.js').FileReader;
var tools = require('./tools.js');
var logger = require('./logger.js');

/* constant */
var extractString = /(['"])((?:\\.|.)+?)\1\s*\+?\s*/g;

function getRegexp(obj) {
	return obj.r;
}

/*
 * emit "parsed:parser" when parse is done
 */
function Parser(eventEmitter) {
	this.eventEmitter = eventEmitter;
	this.init();
}

Parser.prototype.init = function() {
	this.files = [];
	this.countFile = 0;
	this.countItem = 0;

};

Parser.prototype.findFile = function(fileName) {
	var filter = this.files.filter(function(file) {
		return file.name === fileName;
	});

	return filter[0];
};

Parser.prototype.addFile = function(fileName) {
	var fileObj;

	this.countItem++;
	fileObj = {
		name: fileName,
		dependencies: [],
		requiredBy: [],
		type: {
			name: 'undefined',
			color: 'grey'
		}
	};
	this.files.push(fileObj);

	return fileObj;
};

Parser.prototype.addDependency = function(dependencyFile, currentFile) {
	var dependFile;

	dependencyFile = config.requireNameAdapter.reduce(function(id, adapter) {
		return id.replace(adapter.matcher.r, adapter.output);
	}, dependencyFile);

	dependFile = this.findFile(dependencyFile);

	if (!dependFile) {
		dependFile = this.addFile(dependencyFile);
	}

	currentFile.dependencies.push(dependFile.name);
	dependFile.requiredBy.push(currentFile.name);
};

Parser.prototype.parseDone = function() {
	logger.trace('parser.parseDone');

	this.eventEmitter.emit('parsed:parser');
}

Parser.prototype.parseFile = function(path, content) {
	var pathId, items, fileObj, type;

	logger.info('parser.parseFile: path → ' + path);

	pathId = config.fileNameAdapter.reduce(function(id, adapter) {
		return id.replace(adapter.matcher.r, adapter.output);
	}, path);

	fileObj = this.findFile(pathId);
	if (!fileObj) {
		fileObj = this.addFile(pathId);
	}

	type = config.types.find(function(type) {
		return type.matcher.r.test(path);
	});
	if (type) {
		fileObj.type = type;
	}

	config.requireMatcher.forEach(function(matcher) {
		var rslt, depFile;

		logger.debug('to ' + matcher.r.toString())
		do {
			rslt = matcher.r.exec(content);
			if (rslt) {
				depFile = rslt[1] || rslt[0];
				this.addDependency(depFile, fileObj);
			}
		} while(matcher.r.lastIndex > 0);
	}, this);
}

Parser.prototype.parse = function() {
	var exclude, authorized, paths, reader;

	logger.trace('parser.parse');

	exclude = config.fileFilter.blacklist.map(getRegexp);
	authorized = config.fileFilter.whitelist.map(getRegexp);
	paths = config.rootFolders;

	reader = new FileReader(this.parseDone.bind(this), this.parseFile.bind(this));
	reader.setExclude(exclude);
	reader.setAuthorized(authorized);

	paths.forEach(reader.read, reader);
};

module.exports = Parser;
