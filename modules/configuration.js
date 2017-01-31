'use strict';

var fs = require('fs');
var tools = require('./tools.js');

var configuration = {
	/* path of root directories to parse */
	rootFolders: [],
	/* Parse only files which match these rules */
	fileFilter: {
		whitelist: [],
		blacklist: []
	},
	/* Format files name to be more understandable. The result will be used as an id for this file */
	fileNameAdapter: [],
	/* Configure type groups */
	types: [],
	/* Describe what should be analysed to be considered as a dependency. */
	requireMatcher: [{
		pattern: "require\\(['\"]((?:\\\\.|.)*?)['\"]\\)"
	}, {
		pattern: "define\\(\\[['\"]((?:\\\\.|.)*?)['\"]\\]\\)"
	}],
	/* Format require name to match file "id" */
	requireNameAdapter: []
};

configuration.readConfig = function(configPath) {
	var fileConfiguration, fileObj, refPath;

	configPath = configPath || './configuration.json';
	if (/\/$/.test(configPath)) {
		configPath += 'configuration.json';
	} else if (configPath.indexOf('/') === -1) {
		configPath = './' + configPath;
	}
	refPath = configPath.replace(/\/[^\/]+$/, '/');
	configuration.refPath = refPath;

	try {
		fileConfiguration = fs.readFileSync(configPath, {
			encoding: 'utf8'
		});
		logger.info('Configuration file "' + configPath + '" loaded');
	} catch(e) {
		logger.log('Cannot load file "' + configPath + '"');
	}

	if (fileConfiguration) {
		try{
			fileObj = JSON.parse(fileConfiguration, function(key, value) {
				if (key === 'rules') {
					var k, v, r;
					for(k in value) {
						v = value[k];
						if (typeof v === 'object' && v.source) {
							r = new RegExp(v.source, v.flags);
							value[k] = r;
						}
					}
				}

				return value;
			});
		} catch(err) {
			console.error('configuration.json is not a valid JSON file');
			console.error('reason:', err.message);
			process.exit(1);
		}

		tools.extend(configuration, fileObj);
		updatePaths();
		convertObjects();
	}
};

configuration.buildPage = function() {
	var str = 'var __webConfiguration = ';
	var conf = configuration.web;

	str += JSON.stringify(conf);
	str += ';'

	return str;
};

function replacePath(str) {
	if (typeof str !== 'string') {
		if (str instanceof Array) {
			return str.map(replacePath);
		} else
		if (str.path) {
			str.path = replacePath(str.path);
		}
		return str;
	}
	return str.replace(/^(?!\/)(?:\.\/)?/, configuration.refPath);
}

function replaceRegexp(obj) {
	if (obj instanceof Array) {
		return obj.map(replaceRegexp);
	}

	obj.r = new RegExp(obj.pattern, obj.flags);
	if (obj.split) {
		obj.split = replaceRegexp(obj.split);
	}

	return obj;
}

function updatePaths() {
	configuration.rootFolders = replacePath(configuration.rootFolders);

	configuration.log = configuration.log && replacePath(configuration.log);
}

/** Replace object string by their object (like regexp)
 */
function convertObjects() {
	configuration.fileNameAdapter.forEach(function(rpl) {
		rpl.matcher = replaceRegexp(rpl.matcher);
	});
	configuration.requireNameAdapter.forEach(function(rpl) {
		rpl.matcher = replaceRegexp(rpl.matcher);
	});
	configuration.types.forEach(function(type) {
		type.matcher = replaceRegexp(type.matcher);
	});
	configuration.requireMatcher = replaceRegexp(configuration.requireMatcher);
	configuration.fileFilter.whitelist = replaceRegexp(configuration.fileFilter.whitelist);
	configuration.fileFilter.blacklist = replaceRegexp(configuration.fileFilter.blacklist);
}

module.exports = configuration;

/* required after module exports to avoid cycle requirement */
var logger = require('./logger.js');
