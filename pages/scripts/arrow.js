(function() {
	'use strict';
	var xmlns = 'http://www.w3.org/2000/svg';

	function Arrow(box1, box2, options={}) {
		this.box1 = box1;
		this.box2 = box2;
		this.options = options;
		this.columnManager = options.columnManager || new ColumnManager();
		this._columns = [];
		this.el();
	}

	// average strokeWidth
	Arrow.prototype.height = 3;

	Arrow.prototype.remove = function() {
		if (this._element) {
			this._element.parentNode.removeChild(this._element);
		}
		this._element = null;
		this._columns.forEach(c => this.columnManager.removeItem(this, c));
	};

	Arrow.prototype.setColumn = function() {};

	Arrow.prototype.el = function(parentEl=this.SVG_ARROWS, className=this.options.className) {
		var path = document.createElementNS(xmlns, 'path');
		var [x1, y1, p1] = this.box1.getPort('out');
		var [x2, y2, p2] = this.box2.getPort('in');

		path.setAttribute('class', 'arrow-link ' + className);
		path.setAttribute('d', p1 + 'L' + x2 + ',' + y2 + p2);
		path.onclick = this.setLinkActive.bind(this, path);
		parentEl.appendChild(path);

		this._element = path;
	};

	Arrow.prototype.setClass = function(className) {
		if (this.options.className) {
			this._element.classList.remove(this.options.className);
		}
		this.options.className = className;
		this._element.classList.add(className);
	};

	Arrow.prototype.setActive = function(className=null) {
		this.SVG_ARROWS_ACTIVE.appendChild(this._element);
		if (className !== null) {
			this.setClass(className);
		}
	};

	Arrow.prototype.setInactive = function(deep=false) {
		this._element.classList.remove('active');
		this.SVG_ARROWS.appendChild(this._element);

		if (deep) {
			this.box1.setInactive(false);
			this.box2.setInactive(false);
		}
	};

	Arrow.prototype.setLinkActive = function() {
		setActive(this);
		this._element.classList.add('active');
		this.box1.setActive(false);
		this.box2.setActive(false);
	};

	Arrow.prototype.changeX = function() {
		//TODO debounce
		this.remove();
		this.el();
	};

	self.Arrow = Arrow;
})();
