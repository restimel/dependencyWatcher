(function() {
	'use strict';
	var xmlns = 'http://www.w3.org/2000/svg';

	function defaults(obj, defaultObj) {
		for (var x in defaultObj) {
			if (defaultObj.hasOwnProperty(x) && typeof obj[x] === 'undefined') {
				obj[x] = defaultObj[x];
			}
		}
	}

	function Item(data, options={}) {
		this.data = data;
		this.options = options;
		defaults(this.options, {
			x: 0,
			y: 0
		});
		this.parent = options.parent;
		this.children = [];
		this._createSVGEl();
	}

	Item.prototype._createSVGEl = function() {
		var rect, text, padding, bbox;

		this.el = document.createElementNS(xmlns, 'g');
		rect = document.createElementNS(xmlns, 'rect');
		text = document.createElementNS(xmlns, 'text');

	// <rect x="0" y="0" fill="#eaeaea" stroke="#666" width="200" height="100" rx="3" ry="3"></rect>
		padding = 10;

		this.el.setAttribute('id', this.data.name);
		this.el.onclick = displayDetails.bind(this, this.data);

		text.textContent = this.data.name;
		// add text to SVG to compute its size
		this.SVG.appendChild(text);
		bbox = text.getBBox();

		this.x = this.options.x;
		this.y = this.options.y;
		this.height = bbox.height + 2 * padding;
		this.width = bbox.width + 2 * padding;

		text.setAttribute('x', this.x + padding);
		text.setAttribute('y', this.y + bbox.height + padding);

		rect.setAttribute('x', this.x);
		rect.setAttribute('y', this.y);
		rect.setAttribute('width', this.width);
		rect.setAttribute('height', this.height);
		rect.setAttribute('class', 'fileItem');
		rect.setAttribute('fill', '#eaeaea');
		rect.setAttribute('stroke', '#666666');

		this.el.appendChild(rect);
		this.el.appendChild(text);
	};

	Item.prototype.getBound = function(deep=0) {
		console.warn('compute with child');
		if (deep === 0) {
			return [this.y, this.y + this.height];
		} else {
			return this.children.reduce((bounds, subItem) => {
				var [x, y] = subItem.getBound(deep - 1);
				return [Math.min(x, bounds[0]), Math.max(y, bounds[1])];
			}, [Infinity, -Infinity])
		}
	};

	Item.prototype.addBox = function(data) {
		var options = {
			x: this.x + this.width + 30,
			y: this.y + this.children.length * 60,
			parent: this
		};
		var subItem = new Item(data, options);
		this.children.push(subItem);

		return subItem;
	};

	Item.prototype.getBox = function(boxName, done = []) {
		if (done.includes(this)) return;
		done.push(this);
		if (this.data.name === boxName) return this;
		return this.children.find(s=>s.getBox(boxName, done))
			|| (this.parent && this.parent.getBox(boxName, done));
	};

self.Item = Item;
})();