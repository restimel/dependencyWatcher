// let worker = new Worker('scripts/workerVirtualSVG.js');
let worker = new WorkerVirtualSVG();
worker.onmessage = function(evt) {
    const action = evt.data.action;
    const data = evt.data.data;

    if (!this.vSVG) {
        error('VirtualSVG not bound.');
    }
    if (typeof this.vSVG[action] === 'function') {
        this.vSVG[action](data);
    } else {
        error(action === 'error' ? data : evt.data);
    }
};

function error(data) {
    console.error('error in worker', data);
}

function VirtualSVG(newItems = [], newRootItems = []) {
    worker.vSVG = this;
    let columns = [];
    let items = newItems;
    let rootItems = newRootItems;
    let itemsList = new Map();
    let arrows = [];
    
    const result = {
        arrows: [],
        itemsList: itemsList,
        tooManyArrows: false,
        tooManyBoxes: false,
        bounds: [0, 0, 0, 0],
        status: 'ready',
        reset: function (newItems, newRootItems) {
            worker.postMessage({
                action: 'reset',
                data: {
                    newItems, newRootItems
                }
            });
            itemsList = new Map();
            this.itemsList = itemsList;
            columns = [];
            arrows = [];
            items = newItems;
            rootItems = newRootItems;
            // Arrows are build like [index of column, index in column, index in Arrow slot, item reference]
            this.arrows = [];
            this.bounds = [0, 0, 0, 0];
            this.status = 'progress-0';

            this.tooManyArrows = false;
            this.tooManyBoxes = false;
        },
        getArrows: function() {
            return arrows;
        },
        prepare: function() {
            this.result = 'progress-0';
        },
    };

    this.setResult = function(rslt) {
        Object.assign(result, rslt);
    };

    this.setRealArrows = function (rslt) {
        arrows = rslt;
    };

    this.setProgress = function(status) {
        result.status = status;
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
