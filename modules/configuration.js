'use strict';

var fs = require('fs');
var tools = require('./tools.js');

var defaultConfiguration = {
	/* name of configuration */
	name: 'default',
	/* path of root directories to parse */
	rootFolders: [],
	/* Parse only files which match these rules */
	fileFilter: {
		whitelist: [],
		blacklist: []
	},
	/* Format files name to be unique. The result will be used as an id for this file */
	fileNameAdapter: [],
	/* Format files name to be more understandable. The result will be displayed in boxes */
	fileLabelAdapter: [],
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

var configuration = {
	configuration: [tools.extend({}, defaultConfiguration)],
	/* The id of the configuration to be displayed */
	currentConf: 0,
	/* level of Logs*/
	logLevel: 3,
	/* Settings about security */
	security: {
		passwordFile: '',
		maxStoreSalt: 10
	},

	/*private attributes should not be changed */
	_logLevel: -1,
	_parsed: []
};

/* Assert that configuration is valid */
configuration.checkConfig = function() {
	function isInt(value) {
		return typeof value === 'number' && value >= 0 && value%1 === 0;
	}
	function isArray(value) {
		return value instanceof Array;
	}

	var msg;
	var errors = [];

	if (!isInt(configuration.logLevel)) {
		errors.push('logLevel');
	}
	if (!isInt(configuration.currentConf)) {
		errors.push('currentConf');
	}

	if (!isArray(configuration.configuration) || configuration.configuration.length === 0) {
		errors.push('configuration');
	} else {
		configuration.configuration.forEach(function(conf, idx) {
			if (!isArray(conf.rootFolders)) {
				errors.push('configuration['+idx+'].rootFolders');
			}
			if (!isArray(conf.fileFilter.whitelist)) {
				errors.push('configuration['+idx+'].fileFilter.whitelist');
			}
			if (!isArray(conf.fileFilter.blacklist)) {
				errors.push('configuration['+idx+'].fileFilter.blacklist');
			}
			if (!isArray(conf.fileNameAdapter)) {
				errors.push('configuration['+idx+'].fileNameAdapter');
			}
			if (!isArray(conf.fileLabelAdapter)) {
				errors.push('configuration['+idx+'].fileLabelAdapter');
			}
			if (!isArray(conf.types)) {
				errors.push('configuration['+idx+'].types');
			}
			if (!isArray(conf.requireMatcher)) {
				errors.push('configuration['+idx+'].requireMatcher');
			}
			if (!isArray(conf.requireNameAdapter)) {
				errors.push('configuration['+idx+'].requireNameAdapter');
			}
		});
	}

	if (typeof configuration.security !== 'object') {
		errors.push('security');
	} else {
		if (typeof configuration.security.passwordFile !== 'string' && configuration.security.passwordFile !== false) {
			errors.push('security.passwordFile');
		}

		if (!isInt(configuration.security.maxStoreSalt) || configuration.security.maxStoreSalt === 0) {
			errors.push('security.maxStoreSalt');
		}
	}


	if (errors.length) {
		msg = 'Configuration file is not valid.\nThese attributes are not correctly configured:\n' + errors.join('\n');

		logger.error(msg);
		logger.debug(JSON.stringify(configuration));
		process.exit(1);
	}

	return errors.length === 0;
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

		fileObj.configuration = fileObj.configuration.map(function(conf) {
			var defaultConf = tools.clone(defaultConfiguration);
			return tools.extend(defaultConf, conf);
		});

		tools.extend(configuration, fileObj);
		updatePaths();
		this.checkConfig();
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
	configuration.configuration.forEach(function(conf) {
		conf.rootFolders = replacePath(conf.rootFolders);
	});

	configuration.log = configuration.log && replacePath(configuration.log);
	configuration.security.passwordFile = configuration.security.passwordFile && replacePath(configuration.security.passwordFile);
}

/** Replace object string by their object (like regexp)
 */
function convertObjects() {
	configuration.configuration.forEach(function(conf) {
		conf.fileNameAdapter.forEach(function(rpl) {
			rpl.matcher = replaceRegexp(rpl.matcher);
		});
		conf.fileLabelAdapter.forEach(function(rpl) {
			rpl.matcher = replaceRegexp(rpl.matcher);
		});
		conf.requireNameAdapter.forEach(function(rpl) {
			rpl.matcher = replaceRegexp(rpl.matcher);
		});
		conf.types.forEach(function(type) {
			type.matcher = replaceRegexp(type.matcher);
		});
		conf.requireMatcher = replaceRegexp(conf.requireMatcher);
		conf.fileFilter.whitelist = replaceRegexp(conf.fileFilter.whitelist);
		conf.fileFilter.blacklist = replaceRegexp(conf.fileFilter.blacklist);
	});

	if (configuration._logLevel < 0) {
		configuration._logLevel = configuration.logLevel;
	}
}

module.exports = configuration;

/* required after module exports to avoid cycle requirement */
var logger = require('./logger.js');
