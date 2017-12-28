function VirtualSVG(items = [], rootItems = []) {
    this.reset(items, rootItems);
}

VirtualSVG.itemHeight = 30;   // height of each items
VirtualSVG.wireHeight = 3;    // height of each wire
VirtualSVG.itemMarginX = 100; // margin between items
VirtualSVG.itemMarginY = 10;  // margin between items
VirtualSVG.wireMarginY = 3;   // margin between wires

VirtualSVG.prototype.reset = function(items, rootItems) {
    this.itemsList = new Map();
    this.columns = [];
    this.items = items;
    this.rootItems = rootItems;
    // Arrows are build like [index of column, index in column, index in Arrow slot, item reference]
    this.arrows = [];

    this.rootItems.forEach(item => this.add(item.name));
    this.build();
};

VirtualSVG.prototype.add = function(itemName, idx = 0, done = []) {
    let info;
    const item = this.items.get(itemName);
    if (!item) {
        return;
    }
    const name = item.name;

    if (this.itemsList.has(name)) {
        this.move(name, idx, done);
    } else {
        // create a new item
        info = {
            name: name,
            label: item.label,
            dependencies: item.dependencies,
            type: item.type,
            index: idx,
            colIdx: -1,
            arrowSlots: 0,
            width: this.lengthEstimation(item.label),
            height: VirtualSVG.itemHeight,
            x: -1,
            y: -1,
        };
        this.itemsList.set(name, info);

        // add new dependencies
        const idxNext = idx + 1;
        done.push(itemName);
        info.dependencies.forEach(itemName => this.add(itemName, idxNext, done));
        done.pop();
    }
};

VirtualSVG.prototype.move = function(itemName, idx, done = []) {
    const info = this.itemsList.get(itemName);

    if (!info || info.index >= idx || done.includes(itemName)) {
        // already well located or break recursive loop
        return;
    } else {
        // move it to a later location
        info.index = idx;
        const idxNext = idx + 1;
        done.push(itemName);
        info.dependencies.forEach(dep => this.move(dep, idxNext, done));
        done.pop();
    }
};

VirtualSVG.prototype.lengthEstimation = function(str) {
    let length = str.length * 6.5;

    length += str.replace(/[^mw_]/gi, '').length * 1.8;

    return Math.ceil(length);
};

VirtualSVG.prototype.build = function() {
    // fill columns
    for (const [,item] of this.itemsList) {
        if (!this.columns[item.index]) {
            this.columns[item.index] = {
                width: 0,
                height: 0,
                x: 0,
                objects: []
            };
        }

        const column = this.columns[item.index];
        const idx = column.objects.push(item);
        item.colIdx = idx - 1;
    }

    //fill arrows
    for (const [, item] of this.itemsList) {
        const startIdx = item.index;
        const startColIdx = item.colIdx;
        const start = [startIdx, startColIdx, -1, item.name];
        for (const dep of item.dependencies) {
            const depItem = this.itemsList.get(dep);
            if (!depItem) {
                continue;
            }
            const endIdx = depItem.index;
            const endColIdx = depItem.colIdx;
            const inc = endIdx > startIdx ? 1 : -1;
            const arrow = [inc, start];
            let idx = startIdx + 1;
            let colIdx = startColIdx;
            if (inc === 1) {
                while (endIdx !== idx) {
                    colIdx += Math.round((endColIdx - colIdx) / (endIdx + 1 - idx));
                    const elem = this.columns[idx].objects.get(colIdx);
                    const pos = elem.arrowSlots++;
                    arrow.push([idx, colIdx, pos, elem.name]);
                    idx++;
                }
            } else {
                while (endIdx !== idx) {
                    colIdx += Math.round((endColIdx - colIdx) / (idx + 1 - endIdx));
                    idx--;
                    const elem = this.columns[idx].objects.get(colIdx);
                    const pos = elem.arrowSlots++;
                    arrow.push([idx, colIdx, pos, elem.name]);
                }
            }
            arrow.push([endIdx, endColIdx, -2, depItem.name]);
            this.arrows.push(arrow);
        }
    }

    // compute width of columns
    let distance = 0;
    for (const column of this.columns) {
        column.x = distance;
        let width = 0;
        let y = VirtualSVG.itemMarginY;
        column.objects.forEach(item => {
            item.x = distance;
            item.y = y;
            width = Math.max(width, item.width);
            y += item.height + Math.max(VirtualSVG.itemMarginY,
                item.arrowSlots * (VirtualSVG.wireHeight + VirtualSVG.wireMarginY) + VirtualSVG.wireMarginY
            );
        });
        column.width = width;
        column.height = y;
        distance += width + VirtualSVG.itemMarginX;
    }
}