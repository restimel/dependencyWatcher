'use strict';

var fs = require('fs');
var configuration = require('./configuration.js');
var FileReader = require('./fileReader.js').FileReader;
var tools = require('./tools.js');
var logger = require('./logger.js');
var config;

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
    var fileObj, label;

    label = config.fileLabelAdapter.reduce(function(lbl, adapter) {
        return lbl.replace(adapter.matcher.r, adapter.output);
    }, fileName);

    this.countItem++;
    fileObj = {
        name: fileName,
        label: label,
        dependencies: [],
        requiredBy: [],
        type: {
            name: 'undefined',
        },
        path: '',
        canReadFile: false,
        canWriteFile: false
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

Parser.prototype.updateRights = function() {
    this.files.forEach(function(file) {
        if (!file.path) {
            /* forbid to read and write file */
            file.canReadFile = false;
            file.canWriteFile = false;
            return;
        }

        if (file.type.rights) {
            if (typeof file.type.rights.readFile === 'string') {
                file.canReadFile = file.type.rights.readFile;
            } else {
                file.canReadFile = !!file.type.rights.readFile;
            }

            if (typeof file.type.rights.writeFile === 'string') {
                file.canWriteFile = file.type.rights.writeFile;
            } else {
                file.canWriteFile = !!file.type.rights.writeFile;
            }
        }
    });
},

Parser.prototype.parseDone = function() {
    var parseObj;

    logger.trace('parser.parseDone');

    this.updateRights();

    parseObj = JSON.parse(JSON.stringify(this));
    configuration._parsed[configuration.currentConf] = parseObj;
    this.eventEmitter.emit('parsed:parser', parseObj);
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
    fileObj.path = path;

    type = config.types.find(function(type) {
        return type.matcher.r.test(path);
    });
    if (type) {
        fileObj.type = type;
    }

    config.requireMatcher.forEach(function(matcher) {
        var rslt, depFile;

        logger.debug('to ' + matcher.r.toString());
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

    config = configuration.configuration[configuration.currentConf];

    logger.trace('parser.parse ' + config.name);
    /* reset states to avoid duplicated data */
    this.init();

    exclude = config.fileFilter.blacklist.map(getRegexp);
    authorized = config.fileFilter.whitelist.map(getRegexp);
    paths = config.rootFolders;

    reader = new FileReader(this.parseDone.bind(this), this.parseFile.bind(this));
    reader.setExclude(exclude);
    reader.setAuthorized(authorized);

    paths.forEach(reader.read, reader);
};

module.exports = Parser;
