(function() {
	self.global = {
		data: []
	};

	function getData() {
		var xhr = new XMLHttpRequest();
		var url = 'data/links.json';

		xhr.onreadystatechange = function() {
			var rslt;
			if (xhr.readyState === xhr.DONE) {
				if (xhr.status === 200 || xhr.status === 0) {
					rslt = xhr.responseText;
					try {
						rslt = JSON.parse(rslt);
					} catch(e) {
						rslt = null;
						console.error('JSON is not correctly built');
					}
					if (rslt) {
						global.data = rslt;
						self.loadData(global.data);
					}
				} else {
					console.error(xhr.status, url);
				}
            }
		};
		xhr.open('GET', url, true);
		xhr.send(null);
	}

	getData();
})();

// function test() {
// 	global.data = [{"name":"././modules/configuration.js","dependencies":["fs","./tools.js","./logger.js"],"requiredBy":[],"type":{"name":"modules","matcher":{"pattern":"/modules/","r":{}},"color":"blue"}},{"name":"fs","dependencies":[],"requiredBy":["././modules/configuration.js","././modules/fileReader.js","././modules/logger.js","././modules/parser.js","././modules/web-server.js"],"type":{"name":"undefined","color":"grey"}},{"name":"./tools.js","dependencies":[],"requiredBy":["././modules/configuration.js","././modules/fileReader.js","././modules/parser.js"],"type":{"name":"undefined","color":"grey"}},{"name":"./logger.js","dependencies":[],"requiredBy":["././modules/configuration.js","././modules/fileReader.js","././modules/parser.js","././modules/web-server.js"],"type":{"name":"undefined","color":"grey"}},{"name":"././modules/fileReader.js","dependencies":["fs","./tools.js","./logger.js"],"requiredBy":[],"type":{"name":"modules","matcher":{"pattern":"/modules/","r":{}},"color":"blue"}},{"name":"././modules/logger.js","dependencies":["fs","./configuration.js"],"requiredBy":[],"type":{"name":"modules","matcher":{"pattern":"/modules/","r":{}},"color":"blue"}},{"name":"./configuration.js","dependencies":[],"requiredBy":["././modules/logger.js","././modules/parser.js","././modules/web-router.js"],"type":{"name":"undefined","color":"grey"}},{"name":"././modules/parser.js","dependencies":["fs","./configuration.js","./fileReader.js","./tools.js","./logger.js"],"requiredBy":[],"type":{"name":"modules","matcher":{"pattern":"/modules/","r":{}},"color":"blue"}},{"name":"./fileReader.js","dependencies":[],"requiredBy":["././modules/parser.js"],"type":{"name":"undefined","color":"grey"}},{"name":"././modules/tools.js","dependencies":[],"requiredBy":[],"type":{"name":"modules","matcher":{"pattern":"/modules/","r":{}},"color":"blue"}},{"name":"././modules/web-router.js","dependencies":["./web-server.js","./configuration.js"],"requiredBy":[],"type":{"name":"modules","matcher":{"pattern":"/modules/","r":{}},"color":"blue"}},{"name":"./web-server.js","dependencies":[],"requiredBy":["././modules/web-router.js"],"type":{"name":"undefined","color":"grey"}},{"name":"././modules/web-server.js","dependencies":["util","http","fs","url","events","./logger.js"],"requiredBy":[],"type":{"name":"modules","matcher":{"pattern":"/modules/","r":{}},"color":"blue"}},{"name":"util","dependencies":[],"requiredBy":["././modules/web-server.js"],"type":{"name":"undefined","color":"grey"}},{"name":"http","dependencies":[],"requiredBy":["././modules/web-server.js"],"type":{"name":"undefined","color":"grey"}},{"name":"url","dependencies":[],"requiredBy":["././modules/web-server.js"],"type":{"name":"undefined","color":"grey"}},{"name":"events","dependencies":[],"requiredBy":["././modules/web-server.js"],"type":{"name":"undefined","color":"grey"}}];

// 	self.loadData();
// }

// setTimeout(test, 50);