function VirtualSVG(newItems = [], newRootItems = []) {
    let columns = [];
    let items = newItems;
    let rootItems = newRootItems;
    let itemsList = new Map();
    let arrows = [];

    const addItem = (itemName, idx = 0, done = []) => {
        let info;
        const item = items.get(itemName);
        if (!item) {
            return;
        }
        const name = item.name;

        if (itemsList.has(name)) {
            moveBox(name, idx, done);
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
                width: lengthEstimation(item.label),
                height: VirtualSVG.itemHeight,
                x: -1,
                y: -1,
            };
            itemsList.set(name, info);

            // add new dependencies
            const idxNext = idx + 1;
            done.push(itemName);
            info.dependencies.forEach(itemName => addItem(itemName, idxNext, done));
            done.pop();
        }
    };

    const moveBox = (itemName, idx, done = []) => {
        const info = itemsList.get(itemName);

        if (!info || info.index >= idx || done.includes(itemName)) {
            // already well located or break recursive loop
            return;
        } else {
            // move it to a later location
            info.index = idx;
            const idxNext = idx + 1;
            done.push(itemName);
            info.dependencies.forEach(dep => moveBox(dep, idxNext, done));
            done.pop();
        }
    };

    const lengthEstimation = (str) => {
        return str.length * 10;
    };

    const build = () => {
        // fill columns
        for (const [, item] of itemsList) {
            if (!columns[item.index]) {
                columns[item.index] = {
                    width: 0,
                    height: 0,
                    x: 0,
                    objects: []
                };
            }

            const column = columns[item.index];
            const idx = column.objects.push(item);
            item.colIdx = idx - 1;
        }

        // compute width of columns
        let distance = 0;
        for (const column of columns) {
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

        self.configuration.perfStart('buildVirtual Arrows');

        //fill arrows
        for (const [, item] of itemsList) {
            const startIdx = item.index;
            const startColIdx = item.colIdx;
            const start = [startIdx, startColIdx, -1, item.name];
            for (const dep of item.dependencies) {
                const depItem = itemsList.get(dep);
                if (!depItem) {
                    continue;
                }
                const endIdx = depItem.index;
                const endColIdx = depItem.colIdx;
                const inc = endIdx > startIdx ? 1 : -1;
                let idx = startIdx + 1;
                const arrow = new Array(Math.abs(endIdx - idx + 3));
                arrow[0] = inc;
                arrow[1] = start;
                let colIdx = startColIdx;
                let arrIdx = arrow.length;
                if (inc === 1) {
                    while (endIdx !== idx) {
                        colIdx += Math.round((endColIdx - colIdx) / (endIdx + 1 - idx));
                        const elem = columns[idx].objects.get(colIdx);
                        const pos = elem.arrowSlots++;
                        arrow[arrIdx++] = [idx, /* colIdx */, pos, elem.name];
                        idx++;
                    }
                } else {
                    while (endIdx !== idx) {
                        colIdx += Math.round((endColIdx - colIdx) / (idx + 1 - endIdx));
                        idx--;
                        const elem = columns[idx].objects.get(colIdx);
                        const pos = elem.arrowSlots++;
                        arrow[arrIdx++] = [idx, /* colIdx */, pos, elem.name];
                    }
                }
                arrow[arrIdx] = [endIdx, endColIdx, -2, depItem.name];
                arrows.push(arrow);
            }
        }

        self.configuration.perfEnd('buildVirtual Arrows');

        // export results
        if (itemsList.size > VirtualSVG.maxBox) {
            result.tooManyBoxes = true;
        } else {
            result.tooManyBoxes = false;
        }
        const lastColumn = columns.get(Infinity);
        if (lastColumn) {
            result.bounds[2] = lastColumn.width + lastColumn.x;
            result.bounds[3] = Math.max(0, ...columns.map(c => c.height));
        }

        if (arrows.length > VirtualSVG.maxArrows) {
            result.tooManyArrows = true;
            result.arrows = [];
        } else {
            result.tooManyArrows = false;
            result.arrows = arrows;
        }
    };

    const result = {
        arrows: [],
        itemsList: itemsList,
        tooManyArrows: false,
        tooManyBoxes: false,
        bounds: [0, 0, 0, 0],
        reset: function (newItems, newRootItems) {
            itemsList = new Map();
            this.itemsList = itemsList;
            columns = [];
            arrows = [];
            items = newItems;
            rootItems = newRootItems;
            // Arrows are build like [index of column, index in column, index in Arrow slot, item reference]
            this.arrows = [];
            this.bounds = [0, 0, 0, 0];

            this.tooManyArrows = false;
            this.tooManyBoxes = false;

            self.configuration.perfStart('buildVirtual');
            rootItems.forEach(item => addItem(item.name));
            build();
            self.configuration.perfEnd('buildVirtual');
        },
        getArrows: function() {
            return arrows;
        },
    };

    return result;
}

VirtualSVG.itemHeight = 30;   // height of each items
VirtualSVG.wireHeight = 3;    // height of each wire
VirtualSVG.itemMarginX = 100; // margin between items
VirtualSVG.itemMarginY = 10;  // margin between items
VirtualSVG.wireMarginY = 2;   // margin between wires
VirtualSVG.maxArrows = 2000;  // Do not display arrows when the number reach this value
VirtualSVG.maxBox = 2000;  // Do not display boxes when the number reach this value
