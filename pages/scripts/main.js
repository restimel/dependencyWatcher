function module_main() {
	'use strict';

	self.global = {
		data: [],
		types: {}
	};

	function getData(confIdx=0) {
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
			if (self.rootItem.length) {
				self.rootItem.forEach(item => item.remove());
				self.rootItem = [];
				self.reset();
			}
			getData(el.value);
		};
	}

	var elemNotification = document.querySelector('.notification');
	var elemNotificationTitle = document.querySelector('.notification header');
	var elemNotificationBody = document.querySelector('.notification p');
	self.notification = function notification(title, message = '', type = 'success') {
		if (notification.timer) {
			clearTimeout(notification.timer);
		}

		let time = {
			'success': 3000,
			'warn': 10000,
			'danger': 20000
		}[type] || 10000;

		elemNotificationTitle.textContent = title;
		elemNotificationBody.textContent = message;
		elemNotification.classList.remove('danger', 'warn', 'success');
		elemNotification.classList.add('active', type);
		notification.timer = setTimeout(() => elemNotification.classList.remove('active'), time);
	};
	document.querySelector('.notification button').onclick = () => {
		elemNotification.classList.remove('active');
	}

	self.reset = self.reset || function() {};

	getData();
	changeConfiguration();
}

module_main();
module_filter();
module_details();
module_svg();
module_code();
