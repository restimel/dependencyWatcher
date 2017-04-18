(function() {
var elDetails = document.getElementById('detailsArea');
var elTitle = document.getElementById('detailsTitle');
var elDependencies = document.getElementById('dependencies');
var elRequired = document.getElementById('requiredBy');
var elDepNb = document.getElementById('depNb');
var elReqByNb = document.getElementById('reqByNb');
var loadDataOrig = self.loadData;

function loadData() {
	displayDetails(global.data[0]);
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

function displayDetails(itemData, item) {
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
		item.setActive(true);
	} else if (self.rootItem) {
		self.rootItem.getBox(itemData.name).setActive(true);
	}
}

if (typeof loadDataOrig === 'function') {
	self.loadData = function() {
		loadDataOrig.apply(this, arguments);
		loadData();
	};
} else {
	self.loadData = loadData;
}

self.displayDetails = displayDetails;
})();
