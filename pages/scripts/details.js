function module_details() {
var elDetails = document.querySelector('li[data-tab=details]');
var elTitle = document.getElementById('detailsTitle');
var elSubtitle = document.getElementById('detailsSubtitle');
var elDependencies = document.getElementById('dependencies');
var elRequired = document.getElementById('requiredBy');
var elDepNb = document.getElementById('depNb');
var elReqByNb = document.getElementById('reqByNb');
var elCodeBtn = document.getElementById('watchCode');
var elGroupContent = document.getElementById('groupDetails');
var elDialogTypeColor = document.getElementById('dialogTypeColor');
var elInputTypeColor = document.getElementById('inputTypeColor');
var elInputTypeBgColor = document.getElementById('inputTypeBgColor');
var elTitleType = document.getElementById('TypeTitle');
var elCloseTypeColor = document.getElementById('closeTypeColor');
var elCancelTypeColor = document.getElementById('cancelTypeColor');
var loadDataOrig = self.loadData;
var isGroupDefined = false;
var lastAction  ='details';
var currentMainItem;

function loadData() {
	if (global.data) {
		displayDetails(global.data[0]);
	}
}

function reset() {
	currentMainItem = null;
	isGroupDefined = false;
	global.types = {};
}

function selectTab(action=lastAction) {
	var el, elActive, elTab;

	lastAction = action;

	switch(action) {
		case 'details': displayDetails(); break;
		case 'groups': displayGroups(); break;
	}

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

function displayDetails(itemData=currentMainItem, item=null, center=false, active=false) {
	currentMainItem = itemData;
	elDetails.scrollTop = 0;
	elTitle.textContent = itemData.label;
	if (itemData.label === itemData.name) {
		elSubtitle.textContent = '';
	} else {
		elSubtitle.textContent = itemData.name;
	}
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
	if (active) {
		if (item) {
			item.setActive(true, center);
		} else if (self.rootItem && self.rootItem[0]) {
			self.rootItem[0].getBox(itemData.name).setActive(true, center);
		}
	}

	if (itemData.canReadFile) {
		elCodeBtn.style.display = 'inline-block';
	} else {
		elCodeBtn.style.display = 'none';
	}
}

function displayGroups(forceRefresh=false) {
	if (!forceRefresh && isGroupDefined) {
		return;
	}

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
		elColor.style.backgroundColor = getBgColorType(group);
		elColor.style.borderColor = getColorType(group);
		elColor.onclick = dialogColors.bind(group);
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

function dialogColors() {
	var type = this;
	var color = getColorType(type);
	var bgColor = getBgColorType(type);

	elInputTypeColor.value = color;
	elInputTypeBgColor.value = bgColor;
	elTitleType.textContent = type.name;

	elDialogTypeColor.showModal();
	elCloseTypeColor.onclick = function() {
		var types = global.types;

		types[type.name].color = elInputTypeColor.value;
		types[type.name].bgColor = elInputTypeBgColor.value;
		self.reset();
		global.types = types;
		self.loadData(global.data);
		displayGroups(true);
		elDialogTypeColor.close();
	};
}

elCancelTypeColor.onclick = function() {
	elDialogTypeColor.close();
};

function getColorType(type={}) {
	type = global.types[type.name] || {};
	return type.color || '#333';
}

function getBgColorType(type={}) {
	type = global.types[type.name] || {};
	return type.bgColor || '#eaeaea';
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
elCodeBtn.onclick = async function() {
	console.info('TODO watch data in file')
	let password, salt, challenge;

	if (!currentMainItem.canReadFile) {
		return;
	} else if (currentMainItem.canReadFile === 'password') {
		password = await tools.getPassword();
		let response = await fetch('get/salt');
		salt = await reponse.getText();
		challenge = salt; //TODO
	}

	let getCode = `/getCode?item=${encodeURIComponent(currentMainItem.name)}`;

	if (salt) {
		getCode += `&salt=${encodeURIComponent(salt)}&challenge=${encodeURIComponent(challenge)}`;
	}

	let code = await fetch(getCode);
	console.log(code);
};

/* click on tab */
document.querySelector('#tabsSelection ul').onclick = function(evt) {
	var action = evt.target.dataset.tab;

	if (action) {
		selectTab(action);
	}
};

self.selectTab = selectTab;
self.displayDetails = displayDetails;
self.getColorType = getColorType;
self.getBgColorType = getBgColorType;
}
