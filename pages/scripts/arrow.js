(function() {
    'use strict';
    var xmlns = 'http://www.w3.org/2000/svg';

    function Arrow(box1, box2, options={}) {
        this.box1 = box1;
        this.box2 = box2;
        this.options = options;
        this.columnManager = options.columnManager || new ColumnManager();
        this._columns = [];
        this._y = {};
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
        this._y = {};
    };

    Arrow.prototype.setColumn = function() {};

    Arrow.prototype.el = function(parentEl=this.SVG_ARROWS, className=this.options.className) {
        const ponderationLine = 40;
        const ponderationPort = 20;
        var path = document.createElementNS(xmlns, 'path');
        var [x1, y1, p1] = this.box1.getPort('out');
        var [x2, y2, p2] = this.box2.getPort('in');
        var c1 = this.box1.column + 1;
        var c2 = this.box2.column;
        var x = x1, y = y1, xOld;
        var p = ['C', x + ponderationPort, y]; // path between ports

        function estimateY(x1, y1, x2, y2, x) {
            // compute a linear straight f(x) = ax + b
            return (y2-y1) / (x2-x1) * x + (x2*y1 - x1*y2) / (x2-x1);
        }

        if (this._element) {
            this.remove();
        }

        if (c1 > c2) {
            // moving backward
            while (c1 > c2) {
                c1--;
                this._columns.push(c1);

                // compute path inside this column
                xOld = x;
                x = this.columnManager.getX(c1);
                y = this.columnManager.getBestPosition(c1, this.height, estimateY(xOld, y, x2, y2, x + 75), {
                    margin: 0
                });
                p.push(x + this.columnManager.getWidth(c1) + ponderationLine, y, x + this.columnManager.getWidth(c1), y, 'L', x, y, 'C', x - ponderationLine, y);
                this.columnManager.addItem(this, c1);
                this._y[c1] = y - this.height/2;
            }
        } else {
            // moving forward
            while (c1 < c2) {
                this._columns.push(c1);

                // compute path inside this column
                xOld = x;
                x = this.columnManager.getX(c1);
                y = this.columnManager.getBestPosition(c1, this.height, estimateY(xOld, y, x2, y2, x + 75), {
                    margin: 0
                });
                p.push(x - ponderationLine, y, x, y, 'L', x + this.columnManager.getWidth(c1), y, 'C', x + this.columnManager.getWidth(c1) + ponderationLine, y);
                this.columnManager.addItem(this, c1);
                this._y[c1] = y - this.height/2;

                c1++;
            }
        }
        p.push(x2 - ponderationPort, y2, x2, y2);

        path.setAttribute('class', 'arrow-link ' + className);
        path.setAttribute('d', p1 + p.join(' ') + p2);
        path.onclick = this.setLinkActive.bind(this, path);
        parentEl.appendChild(path);

        this._element = path;
    };

    Arrow.prototype.setClass = function(className) {
        if (this.options.className) {
            this._element.classList.remove(this.options.className);
        }

        this.options.className = className;

        if (className) {
            this._element.classList.add(className);
        }
    };

    Arrow.prototype.setActive = function(className=null) {
        this.SVG_ARROWS_ACTIVE.appendChild(this._element);
        if (className !== null) {
            this.setClass(className);
        }
    };

    Arrow.prototype.setInactive = function(deep=false) {
        this._element.classList.remove('active', 'parentLink');
        this.SVG_ARROWS.appendChild(this._element);

        if (deep) {
            this.box1.setInactive(false);
            this.box2.setInactive(false);
        }
    };

    Arrow.prototype.setLinkActive = function() {
        setActive(this);
        this.setActive('active');
        this.box1.setActive(false);
        this.box2.setActive(false);
    };

    Arrow.prototype.changeX = function() {
        //TODO debounce
        this.remove();
        this.el();
    };

    Arrow.prototype.getY = function(index) {
        if (typeof this._y[index] !== 'undefined') {
            return this._y[index];
        }
        return 0;
    };

    self.Arrow = Arrow;
})();
