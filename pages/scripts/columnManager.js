(function() {
    'use strict';

    function ColumnManager() {
        this.columns = {};
        this.columnsOrder = []; //TODO
    }

    ColumnManager.prototype.margin = 5; // space between all items (items and wire)
    ColumnManager.prototype.wiresSpace = 40; // default space between items (to draw wires between them)
    ColumnManager.prototype.gridX = 60; // space between columns
    ColumnManager.prototype.width = 110; // default width of a column

    /* column size */

    ColumnManager.prototype.changeWidth = function(index, width) {
        var idx;

        this.getX(index); // ensure this was previously set (to keep position of this one)
        if (this.columns[index].width >= width) {
            return;
        }
        this.columns[index].width = width;
        // reset all x position of next columns
        for (var i = this.columnsOrder.indexOf(index) + 1; i < this.columnsOrder.length; i++) {
            idx = this.columnsOrder[i];
            // force computation of this column
            this.columns[idx].x = undefined;
            // notify all items in this column that x has changed
            this.columns[idx].forEach(item => item.changeX());
        }
    };

    ColumnManager.prototype.getWidth = function(index) {
        return this.columns[index].width;
    };

    ColumnManager.prototype.getX = function(index, done=[]) {
        var idx, columnIndex, x;

        if (!this.columns[index]) {
            console.warn('getX failed to find index "%s" (there are currently %d indexes)', index, this.columnsOrder.length);
            return;
        }

        if (typeof this.columns[index].x === 'undefined') {
            if (done.includes(index)) {
                return;
            }
            done.push(index);
            idx = this.columnsOrder.indexOf(index);
            if (idx > 0) {
                columnIndex = this.columnsOrder[idx - 1];
                x = this.getX(columnIndex, done);
            }
            if (typeof x !== 'undefined') {
                x += this.columns[columnIndex].width + this.gridX;
            } else {
                if (idx < this.columnsOrder.length - 1) {
                    columnIndex = this.columnsOrder[idx + 1];
                    x = this.getX(columnIndex, done);
                }
                if (typeof x === 'undefined') {
                    x = 0;
                } else {
                    x -= this.columns[index].width + this.gridX;
                }
            }
            this.columns[index].x = x;
        }

        return this.columns[index].x;
    };

    /* column management */

    ColumnManager.prototype._createColumn = function(index=0, beforeColumn=null) {
        if (!this.columns[index]) {
            this.columns[index] = [];
            this.columns[index].width = this.width;

            let colIndex = this.columnsOrder.indexOf(beforeColumn);

            if (colIndex === -1) {
                this.columnsOrder.push(index);
            } else {
                this.columnsOrder.splice(index, 0, [index]);
            }
        }
    };

    ColumnManager.prototype.removeItem = function(item, colIndex=item.column) {
        var column = this.columns[colIndex];
        if (!column) return;
        var index = column.indexOf(item);

        if (index === -1) return;
        column.splice(index, 1);
        item.column = undefined;
    };

    ColumnManager.prototype.addItem = function(item, index=0) {
        item.setColumn(index);
        this._createColumn(index);
        this.columns[index].push(item);
    };

    /* check for position */

    ColumnManager.prototype.hasSpace = function(index, y1, y2, option={}) {
        return !this.getConflict(index, y1, y2, option);
    };

    ColumnManager.prototype.getConflict = function(index, y1, y2, options={}) {
        var column = this.columns[index];
        var {margin=0, item:avoidItem} = options;

        margin += this.margin;
        return column.find(item => {
            var y = item.getY(index);
            return item !== avoidItem
                && y <= y2 + margin
                && y + item.height + margin >= y1;
        });
    };

    ColumnManager.prototype.getConflicts = function(index, y1, y2, options={}) {
        var column = this.columns[index];
        var {margin=0, item:avoidItem} = options;

        margin += this.margin;
        return column.filter(item => {
            var y = item.getY(index);
            return item !== avoidItem
                && y <= y2 + margin
                && y + item.height + margin >= y1;
        });
    };

    ColumnManager.prototype.getBestPosition = function(index, height, y=0, options={}) {
        var item;

        if (typeof options.margin === 'undefined') {
            options.margin = this.wiresSpace;
        }

        while (item = this.getConflict(index, y, y + height, options)) {
            // XXX: +1 is needed to avoid conflict on edge
            y = item.getY(index) + item.height + options.margin + this.margin + 1;
        }

        return y;
    };

    self.ColumnManager = ColumnManager;
})();