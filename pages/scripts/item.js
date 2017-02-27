(function() {
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
		this.children = [];
		this._createSVGEl();
	}

	Item.prototype._createSVGEl = function() {
		var rect, text;
		this.el = document.createElementNS(xmlns, 'g');
		rect = document.createElementNS(xmlns, 'rect');
	// <rect x="0" y="0" fill="#eaeaea" stroke="#666" width="200" height="100" rx="3" ry="3"></rect>
		console.warn('TODO: compute x  & y', this.data);
		this.x = this.options.x;
		this.y = this.options.y;
		this.width = this.data.name.length * 10;
		this.height = 50;

		rect.setAttribute('x', this.x);
		rect.setAttribute('y', this.y);
		rect.setAttribute('width', this.width);
		rect.setAttribute('height', this.height);
		rect.setAttribute('class', 'fileItem');
		rect.setAttribute('fill', '#eaeaea');
		rect.setAttribute('stroke', '#666666');
		rect.onclick = displayDetails.bind(this, this.data);

		this.el.appendChild(rect);
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
			y: this.y + this.children.length * 60
		};
		var subItem = new Item(data, options);
		this.children.push(subItem);

		return subItem;
	};

self.Item = Item;
})();