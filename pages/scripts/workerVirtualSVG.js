'use strict';

// importScripts('tools.js');
// const VirtualSVG = {};

//simulate a worker behavior
// XXX Worker is not used because it is too slow to send/receive the result
function WorkerVirtualSVG() {
    let onmessage = () => {};
    const postMessage = (message) => {
        this.onmessage({
            type: 'message',
            data: message
        });
    };

    let columns = [];
    let items = [];
    let rootItems = [];
    let itemsList = new Map();
    let arrows = [];

    const result = {
        arrows: [],
        itemsList: itemsList,
        tooManyArrows: false,
        tooManyBoxes: false,
        bounds: [0, 0, 0, 0],
        status: 'ready',
    };

    onmessage = function(evt) {
        const action = '$' + evt.data.action;
        const data = evt.data.data;

        if (typeof this[action] === 'function') {
            this[action](data);
        } else {
            postMessage({action: 'error', data: 'function "' + action + '" not found in worker'});
        }
    };

    function lengthEstimation(str) {
        return str.length * 10;
    }

    function addItem(itemName, idx = 0, done = []) {
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
    }

    function moveBox(itemName, idx, done = []) {
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

    async function setProgress(nb) {
        result.status = 'progress-' + nb;
        postMessage({
            action: 'setProgress',
            data: result.status
        });
        await new Promise((s) => setTimeout(s, 1));
    }

    async function build() {
        await setProgress(5);
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

        await setProgress(35);
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

        await setProgress(60);
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

        await setProgress(95);
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

        result.status = 'loaded';
        postMessage({
            action: 'setResult',
            data: result
        });
        postMessage({
            action: 'setRealArrows',
            data: arrows
        });

        setTimeout(isReady, 10);
    }

    function isReady() {
        result.status = 'ready';
        postMessage({
            action: 'setResult',
            data: result
        }); 
    }

    this.$reset = function(args) {
        const {newItems, newRootItems} = args;
        setProgress(0);

        itemsList = new Map();
        result.itemsList = itemsList;
        columns = [];
        arrows = [];
        items = newItems;
        rootItems = newRootItems;
        // Arrows are build like [index of column, index in column, index in Arrow slot, item reference]
        result.arrows = [];
        result.bounds = [0, 0, 0, 0];

        result.tooManyArrows = false;
        result.tooManyBoxes = false;

        rootItems.forEach(item => addItem(item.name));
        build();
    };

    this._onmessage = onmessage;
}

WorkerVirtualSVG.prototype.postMessage = function(message) {
    this._onmessage({
        type: 'message',
        data: message
    });
};
WorkerVirtualSVG.prototype.onmessage = function() {};

// VirtualSVG.itemHeight = 30;   // height of each items
// VirtualSVG.wireHeight = 3;    // height of each wire
// VirtualSVG.itemMarginX = 100; // margin between items
// VirtualSVG.itemMarginY = 10;  // margin between items
// VirtualSVG.wireMarginY = 2;   // margin between wires
// VirtualSVG.maxArrows = 2000;  // Do not display arrows when the number reach this value
// VirtualSVG.maxBox = 2000;  // Do not display boxes when the number reach this value
