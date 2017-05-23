(function() {
var elDetails = document.querySelector('li[data-tab=details]');
var elTitle = document.getElementById('detailsTitle');
var elDependencies = document.getElementById('dependencies');
var elRequired = document.getElementById('requiredBy');
var elDepNb = document.getElementById('depNb');
var elReqByNb = document.getElementById('reqByNb');
var elCodeBtn = document.getElementById('watchCode');
var elGroupContent = document.getElementById('groupDetails');
var loadDataOrig = self.loadData;
var isGroupDefined = false;

function loadData() {
	if (global.data) {
		displayDetails(global.data[0]);
	}
}

function reset() {
	isGroupDefined = false;
}

function selectTab(action='details') {
	var el, elActive, elTab;

	elActive = document.querySelector('li.active');
	el = document.querySelector('li[data-tab=' + action + ']');

	if (el === elActive) {
		return;
	}

	if (elActive) {
		elActive.classList.remove('active');
		elTab = document.querySelector('.tabContent.active');
		elTab.classList.remove('active');
	}

	el.classList.add('active');
	elTab = document.querySelector('.tabContent[data-tab=' + action + ']');
	elTab.classList.add('active');
}

function createItem(itemName) {
	var li = document.createElement('li');
	li.textContent = itemName;
	li.className = 'linkToItem';
	li.onclick = applyFilter.bind(this, itemName);
	return li;
}

function createNoItem() {
	var el = document.createElement('span');
	el.textContent = 'No files';
	el.className = 'noFiles';
	return el;
}

function displayDetails(itemData, item=null, center=false) {
	elDetails.scrollTop = 0;
	elTitle.textContent = itemData.name;
	elDependencies.innerHTML = '';
	elRequired.innerHTML = '';
	elDepNb.textContent = itemData.dependencies.length;
	if (itemData.dependencies.length === 0) {
		elDependencies.appendChild(createNoItem());
	} else {
		itemData.dependencies.forEach(function(dep) {
			elDependencies.appendChild(createItem(dep));
		});
	}
	elReqByNb.textContent = itemData.requiredBy.length;
	if (itemData.requiredBy.length === 0) {
		elRequired.appendChild(createNoItem());
	} else {
		itemData.requiredBy.forEach(function(dep) {
			elRequired.appendChild(createItem(dep));
		});
	}
	if (item) {
		item.setActive(true, center);
	} else if (self.rootItem && self.rootItem[0]) {
		self.rootItem[0].getBox(itemData.name).setActive(true, center);
	}

	if (!isGroupDefined) {
		displayGroups();
	}
}

function displayGroups() {
	var groupList = new Map();
	var groupListItems = {};

	self.global.data.forEach((data) => {
		if (data.type) {
			let name = data.type.name;
			groupList.set(name, data.type);

			if (!groupListItems[name]) {
				groupListItems[name] = new Set();
			}
			groupListItems[name].add(data.name);
		}
	});

	elGroupContent.innerHTML = '';

	for (let [name, group] of groupList) {
		let elDetails = document.createElement('details');
		elDetails.className = 'groupDetail';

		let elSummary = document.createElement('summary');

		let elColor = document.createElement('div');
		elColor.className = 'colorBox';
		elColor.style.backgroundColor = group.color;
		elSummary.appendChild(elColor);

		let label = document.createElement('label');
		label.textContent = name;
		elSummary.appendChild(label);

		let elUl = document.createElement('ul');
		if (groupListItems[name].size) {
			for (let item of groupListItems[name]) {
				elUl.appendChild(createItem(item));
			}
		} else {
			elUl.appendChild(createNoItem());
		}

		elDetails.appendChild(elSummary);
		elDetails.appendChild(elUl);
		elGroupContent.appendChild(elDetails);
	}
	isGroupDefined = true;
}

/* extend loadData */
if (typeof loadDataOrig === 'function') {
	self.loadData = function() {
		loadDataOrig.apply(this, arguments);
		loadData();
	};
} else {
	self.loadData = loadData;
}

/* extend reset */
if (typeof self.reset === 'function') {
    let oldReset = self.reset;

    self.reset = function() {
        oldReset.apply(self, arguments);
        reset();
    };
} else {
    self.loadData = reset;
}

/* click on read code */
elCodeBtn.onclick = function() {
	console.info('TODO watch data in file')
};

/* click on tab */
document.querySelector('#tabsSelection ul').onclick = function(evt) {
	var action = evt.target.dataset.tab;

	if (action) {
		selectTab(action);
	}
};

selectTab('details');

self.displayDetails = displayDetails;
})();
