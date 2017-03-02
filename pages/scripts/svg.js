(function() {
	var SVG = document.getElementById('drawArea');
	var X = 0;
	var Y = 0;
	var WX = 1000;
	var WY = 1000;
	var sizeX = 100;
	var sizeY = 100;
	var mouse = {};
	var loadDataOrig = self.loadData;

	Item.prototype.SVG = SVG;

	function displayItem(item, subItemName) {
		if (item.getBox(subItemName)) return;
		var subData = searchItem(subItemName);
		var subItem = item.addBox(subData);
		SVG.appendChild(subItem.el);

		subData.dependencies.forEach(displayItem.bind(this, subItem));
	}

	function loadData(data) {
		var item = new Item(data[0]);
		SVG.appendChild(item.el);

		data[0].dependencies.forEach(displayItem.bind(this, item));
	}

	function updateYWidth() {
		WY = WX * sizeY / sizeX;
	}

	function windowSize() {
		sizeX = window.innerWidth - 400;
		sizeY = window.innerHeight;
		SVG.setAttribute('height', sizeY);
		SVG.setAttribute('width', sizeX);
		updateYWidth();
		updateBox();
	}

	function updateBox() {
		var boxView = X + ' ' + Y + ' ' + WX + ' ' + WY;
		SVG.setAttribute('viewBox', boxView);
	}

	function getCoord(x, y, origin = [X, Y]) {
		var ratioX = WX / sizeX;
		var ratioY = WY / sizeY;
		var [offsetX, offsetY] = origin;
		return [x * ratioX + offsetX, y * ratioY + offsetY];
	}

	function moveBox(evt) {
		var [x, y] = getCoord(evt.offsetX, evt.offsetY, [mouse.X, mouse.Y]);
		X = mouse.X - x + mouse.x;
		Y = mouse.Y - y + mouse.y;
		updateBox();
	}

	SVG.onmousedown = function(evt) {
		[mouse.px, mouse.py] = [evt.offsetX, evt.offsetY];
		[mouse.x, mouse.y] = getCoord(evt.offsetX, evt.offsetY);
		[mouse.X, mouse.Y] = [X, Y];
		mouse.move = true;
	};

	SVG.onmousemove = function(evt) {
		if (!mouse.move) return;
		moveBox(evt);
	};

	SVG.onmouseup = function(evt) {
		mouse.move = false;
	};

	SVG.onwheel = function(evt) {
		[mouse.X, mouse.Y] = [X, Y];
		[mouse.x, mouse.y] = getCoord(evt.offsetX, evt.offsetY);
		if (evt.deltaY < 0) {
			if (WX <= 50) return;
			WX -= 50;
		} else {
			WX += 50;
		}
		updateYWidth();
		updateBox();
		moveBox(evt);
	};

	window.onresize = windowSize;

	if (typeof loadDataOrig === 'function') {
		self.loadData = function() {
			loadDataOrig.apply(this, arguments);
			loadData.apply(this, arguments);
		};
	} else {
		self.loadData = loadData;
	}

	windowSize();
})();