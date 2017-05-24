(function() {
    'use strict';
    var xmlns = 'http://www.w3.org/2000/svg';

    function defaults(obj, defaultObj) {
        for (var x in defaultObj) {
            if (defaultObj.hasOwnProperty(x) && typeof obj[x] === 'undefined') {
                obj[x] = defaultObj[x];
            }
        }
        return obj;
    }

    function Item(data, options={}) {
        this.data = data;
        this.options = options;
        defaults(this.options, {
            x: 0,
            y: 0
        });
        this.parent = options.parent;
        this.columnManager = options.columnManager || new ColumnManager();

        this._setColumn(options);

        this.children = [];
        this.arrows = [];

        this._checkTypes();

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
        this.children.forEach(c => c.remove());
    };

    Item.prototype._checkTypes = function(options) {
        var type = this.data.type;

        if (!global.types[type.name]) {
            global.types[type.name] = defaults({}, type);
        }
    };

    Item.prototype._setColumn = function(options) {
        if (typeof options.column !== 'undefined') {
            this.column = options.column;
        } else if (this.parent) {
            this.column = this.parent.column + 1;
        }
        this.columnManager.addItem(this, this.column);
    };

    Item.prototype._createSVGEl = function() {
        var rect, text, bbox;

        this.el = document.createElementNS(xmlns, 'g');
        rect = document.createElementNS(xmlns, 'rect');
        text = document.createElementNS(xmlns, 'text');

    // <rect x="0" y="0" fill="#eaeaea" stroke="#666" width="200" height="100" rx="3" ry="3"></rect>

        this.el.setAttribute('id', this.data.name);
        this.el.onclick = displayDetails.bind(this, this.data, this, false, true);

        text.textContent = this.data.name;
        // add text to SVG to compute its size
        this.SVG.appendChild(text);
        bbox = text.getBBox();

        this.x = this.columnManager.getX(this.column) + this.portMargin;
        this.y = this.columnManager.getBestPosition(this.column, bbox.height, this.options.y, {
            item: this
        });
        this.height = bbox.height + 2 * this.padding;
        this.width = bbox.width + 2 * this.padding;
        this.columnManager.changeWidth(this.column, this.width + 2 * this.portMargin);

        text.setAttribute('x', this.x + this.padding);
        text.setAttribute('y', this.y + bbox.height + this.padding);
        text.setAttribute('fill', getColorType(this.data.type));

        rect.setAttribute('x', this.x);
        rect.setAttribute('y', this.y);
        rect.setAttribute('width', this.width);
        rect.setAttribute('height', this.height);
        rect.setAttribute('class', 'fileItem');
        rect.setAttribute('fill', getBgColorType(this.data.type));
        rect.setAttribute('stroke', getColorType(this.data.type));

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

    Item.prototype.getPort = function(orientation, strokeWidth=3) {
        var path = '';
        var x = 0;
        var y = 0;
        const margin = this.portMargin;
        const midHeight = this.height / 2;
        const midMargin = this.portMargin / 2;
        const midStrokeWidth = strokeWidth / 2;

        switch (orientation) {
          case 'in':
              x = this.x - margin;
              y = this.y + midHeight;
              path = ['M', x, y,
                      'h', (margin - midStrokeWidth),
                      'l', -midMargin, midMargin,
                           '0', -margin,
                           midMargin, midMargin,
                           -midMargin*3/4, -midMargin/2,
                           0, midMargin,
                           midMargin*3/4, -midMargin/2
                      ].join(' ');
            break;
          case 'out':
              x = this.x + this.width + margin;
              y = this.y + midHeight;
              path = ['M', (x - margin), y, 'h', margin].join(' ');
            break;

          default:
              break;
        }

        return [x, y, path];;
    };

    Item.prototype.setActive = function(deep=true, center=false) {
        if (deep) {
            setActive(this, center);
            this.arrows.forEach(a => a.setActive());
            this.data.requiredBy.forEach(r =>
                this.getBox(r).getArrow(this).setActive('parentLink')
            );
        }
        this.el.classList.add('active');
    };

    Item.prototype.setInactive = function(deep=true) {
        if (!this.el) {
            return;
        }
        this.el.classList.remove('active');
        if (deep) {
            this.arrows.forEach(a => a.setInactive());
            this.data.requiredBy.forEach(r =>
                this.getBox(r).getArrow(this).setInactive()
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
        var options, subItem;

        options = {
            x: this.x + this.width + 30,
            y: this.y,
            columnManager: this.columnManager,
            parent: this
        };
        subItem = new Item(data, options);
        this.children.push(subItem);

        return subItem;
    };

    /** retrieve a box from its name
     *  @return {Item} undefined if no box has been found
     **/
    Item.prototype.getBox = function(boxName, done = []) {
        var box;

        if (done.includes(this)) return;
        done.push(this);

        if (this.data.name === boxName) return this;

        // search in children
        this.children.some(c => {
            var r = c.getBox(boxName, done);
            if (r) {box = r}
            return r;
        });

        // search in parent
        if (!box) {
            box = this.parent && this.parent.getBox(boxName, done);
        }
        return box;
    };

    /* called by columnManager and should only set attributes value (no change
     * on previous value) */
    Item.prototype.setColumn = function(index) {
        if (typeof this.column !== 'undefined') {
            this.columnManager.removeItem(this);
        }
        this.column = index;
    };

    /* Called to change the column and move elements */
    Item.prototype.changeColumn = function(index, done=[]) {
        var hadEl = !!this.el;

        if (done.includes(this)) {
            return;
        }
        done = done.concat([this]); // do a copy of the array

        if (hadEl) {
            this.el.parentNode.removeChild(this.el);
        }
        this.el = null;
        this.columnManager.removeItem(this);
        this._setColumn({column: index});

        this.children.forEach(c => {
            if (c.column <= this.column) {
                c.changeColumn(this.column  + 1, done);
            }
        });
        this.arrows.forEach(a => a.el());

        if (hadEl) {
            this._createSVGEl();
            this.SVG_BOXES.appendChild(this.el);
        }
    };

    Item.prototype.changeX = function() {
        this.x = this.columnManager.getX(this.column);
        this.el.querySelector('rect').setAttribute('x', this.x);
        this.el.querySelector('text').setAttribute('x', this.x + this.padding);
    };

    Item.prototype.getY = function(index) {
        if (index === this.column) {
            return this.y;
        }
        return 0;
    };

    self.Item = Item;
})();
