(function() {
    'use strict';

    function ColumnManager() {
        this.columns = {};
    }

    ColumnManager.prototype.margin = 20;

    /* column management */

    ColumnManager.prototype._createColumn = function(index=0) {
        if (!this.columns[index]) {
            this.columns[index] = [];
        }
    };

    ColumnManager.prototype.removeItem = function(item) {
        var colIndex = item.column;
        var index = this.column[colIndex].indexOf(item);

        this.column[colIndex].splice(index, 1);
        item.column = undefined;
    };

    ColumnManager.prototype.addItem = function(item, index) {
        item.setColumn(index);
        this._createColumn(index);
        this.columns[index].push(item);
    };

    /* check for position */

    ColumnManager.prototype.hasSpace = function(index, y1, y2, option={}) {
        return !this.getConflict(index, y1, y2, option);
    };

    ColumnManager.prototype.getConflict = function(index, y1, y2, options={}) {
        var column = this.column[index];
        var {margin, item:avoidItem} = options;

        return column.find(item=>{
            return item !== avoidItem
                && item.y <= y2 + margin
                && item.y + item.height + margin >= y1;
        });
    };

    ColumnManager.prototype.getConflicts = function(index, y1, y2, options={}) {
        var column = this.column[index];
        var {margin, item:avoidItem} = options;

        return column.filter(item=>{
            return item !== avoidItem
                && item.y <= y2 + margin
                && item.y + item.height + margin >= y1;
        });
    };

    ColumnManager.prototype.getBestPosition = function(index, height, y=0, options={}) {
        var item;

        while (item = this.getConflict(index, y, y + height, options)) {
            y = item.y + item.height + margin;
        }

        return y;
    };

    self.ColumnManager = ColumnManager;
})();