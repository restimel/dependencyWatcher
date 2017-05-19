(function() {
	self.global = {
		data: []
	};

	function getData(confIdx=0) {
		var xhr = new XMLHttpRequest();
		var url = 'data/links.json?configuration=' + confIdx;

		fetch(url)
			.then(response => response.json(), error => console.error('Failed to retrieve data file' + error.message))
			.then(response => {
				global.data = response;
				if (typeof self.loadData === 'function') {
					self.loadData(global.data);
				}
			}, error => {
				global.data = null;
				console.error('Failed to parse data file' + error.message);
			});
	}

	function changeConfiguration() {
		var el = document.getElementById('confSelect');

		fetch('data/configuration.json')
			.then(response => response.json(), error => console.error('Failed to retrieve configuration file' + error.message))
			.then(response => {
				response.dependencies.forEach((value, idx) => {
					var option = document.createElement('option');
					option.value = idx;
					option.textContent = value;
					el.appendChild(option);
				});
				el.selectedIndex = 0;
			}, error => console.error('Failed to parse configuration file' + error.message));

		el.onchange = function() {
			if (self.rootItem) {
				self.rootItem.remove();
				self.rootItem = null;
				self.reset();
			}
			getData(el.value);
		};
	}

	self.reset = self.reset || function() {};

	getData();
	changeConfiguration();
})();
