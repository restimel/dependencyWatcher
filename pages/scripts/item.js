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
		this._setColumn(options);
		this.children = [];
		this.arrows = [];
		this._createSVGEl();
	}

	Item.prototype.portMargin = 10;
	Item.prototype.padding = 10;

	Item.prototype.remove = function() {
		if (this.el) {
			this.el.parentNode.removeChild(this.el);
		}
		this.el = null;
		this.columnManager.removeItem(this);
		this.arrows.forEach(a => a.remove());
	};

	Item.prototype._setColumn = function(options) {
		if (typeof options.column !== 'undefined') {
			this.column = options.column;
		} else if (this.parent) {
			this.column = this.parent.column + 1;
		}

		this.columnManager = options.columnManager || new ColumnManager();

		this.columnManager.addItem(this, this.column);
	};

	Item.prototype._createSVGEl = function() {
		var rect, text, bbox;

		this.el = document.createElementNS(xmlns, 'g');
		rect = document.createElementNS(xmlns, 'rect');
		text = document.createElementNS(xmlns, 'text');

	// <rect x="0" y="0" fill="#eaeaea" stroke="#666" width="200" height="100" rx="3" ry="3"></rect>

		this.el.setAttribute('id', this.data.name);
		this.el.onclick = displayDetails.bind(this, this.data, this);

		text.textContent = this.data.name;
		// add text to SVG to compute its size
		this.SVG.appendChild(text);
		bbox = text.getBBox();

		this.x = this.columnManager.getX(this.column);// this.options.x;
		this.y = this.columnManager.getBestPosition(this.column, bbox.height, this.options.y, {
			item: this
		});
		this.height = bbox.height + 2 * this.padding;
		this.width = bbox.width + 2 * this.padding;
		this.columnManager.changeWidth(this.column, this.width);

		text.setAttribute('x', this.x + this.padding);
		text.setAttribute('y', this.y + bbox.height + this.padding);

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

	Item.prototype.drawArrows = function(done=[], deep=true, className='') {
		if (done.includes(this)) return;
		done.push(this);
		this.data.dependencies.forEach((child) => {
			var box = this.getBox(child);
			this.arrows.push(new Arrow(this, box, {
				className: className,
				columnManager: this.columnManager
			}));
			if (deep) {
				box.drawArrows(done, deep, className);
			}
		});
	};

	Item.prototype.getPort = function(orientation) {
		var path = '';
		var x = 0;
		var y = 0;
		const margin = this.portMargin;
		const midHeight = this.height / 2;
		const midMargin = this.portMargin / 2;

		switch (orientation) {
		  case 'in':
		  	x = this.x - margin;
		  	y = this.y + midHeight;
		  	path = 'M' + x + ',' + y + ' h' + (margin - 1.5) + ' l-' + midMargin + ',' + midMargin + ' 0,-' + margin + ' ' + midMargin + ',' + midMargin;
		    break;
		  case 'out':
		  	x = this.x + this.width + margin;
		  	y = this.y + midHeight;
		  	path = 'M' + (x - margin) + ',' + y + ' h' + margin;
		    break;

		  default:
		  	break;
		}

		return [x, y, path];;
	};

	Item.prototype.setActive = function(deep=true) {
		if (deep) {
			setActive(this);
			this.arrows.forEach(a => a.setActive());
			this.data.requiredBy.forEach(r =>
				this.getBox(r).getArrow(this).setActive('parentLink')
			);
		}
		this.el.classList.add('active');
	};

	Item.prototype.setInactive = function(deep=true) {
		this.el.classList.remove('active');
		if (deep) {
			this.arrows.forEach(a => a.setInactive());
			this.data.requiredBy.forEach(r =>
				this.getBox(r).getArrow(this).setActive('')
			);
		}
	};

	Item.prototype.getArrow = function(box) {
		return this.arrows.find(a => a.box2 === box);
	};

	Item.prototype.getVBound = function(deep=0, caller=undefined) {
		var idx = Infinity;

		if (deep === 0) {
			return [this.y, this.y + this.height];
		} else {
            if (caller) {
                idx = this.children.indexOf(caller);
                if (idx === -1) {
                    idx = Infinity;
                }
            }
			return this.children.reduce((bounds, subItem, i) => {
                if (i >= idx) return bounds;
				var [x, y] = subItem.getVBound(deep - 1);
				return [Math.min(x, bounds[0]), Math.max(y, bounds[1])];
			}, [Infinity, -Infinity]);
		}
	};

	Item.prototype.getHBound = function(deep=0, caller=undefined) {
		var idx = Infinity;

		if (deep === 0) {
			return [this.x, this.x + this.width];
		} else {
            if (caller) {
                idx = this.children.indexOf(caller);
                if (idx === -1) {
                    idx = Infinity;
                }
            }
			return this.children.reduce((bounds, subItem, i) => {
                if (i >= idx) return bounds;
				var [x, y] = subItem.getHBound(deep - 1);
				return [Math.min(x, bounds[0]), Math.max(y, bounds[1])];
			}, [Infinity, -Infinity]);
		}
	};

	Item.prototype.addBox = function(data) {
        var y = -Infinity;

        //TODO change x/y computation
        // if (this.children.length) {
        //     y = this.getVBound(1)[1];
        // } else if (this.parent) {
        //     y = this.parent.getVBound(2, this)[1];
        // }
        // if (!isFinite(y)) {
        //     y = this.y;
        // }
		var options = {
			x: this.x + this.width + 30,
			y: this.y,
			columnManager: this.columnManager,
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

	Item.prototype.setColumn = function(index) {
		if (typeof this.column !== 'undefined') {
			this.columnManager.removeItem(this);
		}
		this.column = index;

		// this.options.y = this.columnManager.getBestPosition(index, this.options.y);
		// this.options.x = ???
	};

	Item.prototype.changeX = function() {
		this.x = this.columnManager.getX(this.column);
		this.el.querySelector('rect').setAttribute('x', this.x);
	};

	self.Item = Item;
})();
