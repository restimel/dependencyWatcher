(function() {
    var SVG = document.getElementById('drawArea');
    var SVG_BOXES = SVG.querySelector('.boxes');
    var X = 0;
    var Y = 0;
    var WX = 1000;
    var WY = 1000;
    var sizeX = 100;
    var sizeY = 100;
    var mouse = {};
    var activeElement = null;
    var loadDataOrig = self.loadData;

    Item.prototype.SVG = SVG;
    Item.prototype.SVG_BOXES = SVG_BOXES;
    Arrow.prototype.SVG_ARROWS = SVG.querySelector('.arrows');
    Arrow.prototype.SVG_ARROWS_ACTIVE = SVG.querySelector('.arrows-highlight');

    function displayItem(item, subItemName) {
        var sItem = item.getBox(subItemName);
        if (sItem) {
            if (sItem.column <= item.column) {
                sItem.changeColumn(item.column + 1, [item]);
            }
            return;
        }
        var subData = searchItem(subItemName);
        var subItem = item.addBox(subData);
        SVG_BOXES.appendChild(subItem.el);

        subData.dependencies.forEach(displayItem.bind(this, subItem));
    }

    function loadData(data) {
        if (!data) return;
        var item = new Item(data[0]);
        self.rootItem = item;
        SVG_BOXES.appendChild(item.el);

        data[0].dependencies.forEach(displayItem.bind(this, item));
        item.drawArrows();
    }

    function reset() {
        activeElement = null;
        X = 0;
        Y = 0;
        WX = 1000;
        updateYWidth();
        updateBox();
    }

    function updateYWidth() {
        WY = WX * sizeY / sizeX;
    }

    function windowSize() {
        sizeX = window.innerWidth - 400;
        sizeY = window.innerHeight;
        SVG.setAttribute('height', sizeY);
        SVG.setAttribute('width', sizeX);
        updateYWidth();
        updateBox();
    }

    function updateBox() {
        var boxView = X + ' ' + Y + ' ' + WX + ' ' + WY;
        SVG.setAttribute('viewBox', boxView);
    }

    function centerBox(x, y) {
        X = x - WX / 2;
        Y = y - WY / 2;
        updateBox();
    }

    function getCoord(x, y, origin = [X, Y]) {
        var ratioX = WX / sizeX;
        var ratioY = WY / sizeY;
        var [offsetX, offsetY] = origin;
        return [x * ratioX + offsetX, y * ratioY + offsetY];
    }

    function moveBox(evt) {
        var [x, y] = getCoord(evt.offsetX, evt.offsetY, [mouse.X, mouse.Y]);
        X = mouse.X - x + mouse.x;
        Y = mouse.Y - y + mouse.y;
        updateBox();
    }

    function setActive(element, center=false) {
        if (activeElement) {
            activeElement.setInactive(true);
        }
        activeElement = element;
        if (center === true) {
            centerBox(element.x + element.width / 2, element.y + element.height / 2)
        }
    }
    self.setActive = setActive;

    SVG.onmousedown = function(evt) {
        [mouse.px, mouse.py] = [evt.offsetX, evt.offsetY];
        [mouse.x, mouse.y] = getCoord(evt.offsetX, evt.offsetY);
        [mouse.X, mouse.Y] = [X, Y];
        mouse.move = true;
    };

    SVG.onmousemove = function(evt) {
        if (!mouse.move) return;
        moveBox(evt);
    };

    SVG.onmouseup = function(evt) {
        mouse.move = false;
    };

    SVG.onwheel = function(evt) {
        [mouse.X, mouse.Y] = [X, Y];
        [mouse.x, mouse.y] = getCoord(evt.offsetX, evt.offsetY);
        if (evt.deltaY < 0) {
            if (WX <= 50) return;
            WX -= 50;
        } else {
            WX += 50;
        }
        updateYWidth();
        updateBox();
        moveBox(evt);
    };

    window.onresize = windowSize;

    if (typeof loadDataOrig === 'function') {
        self.loadData = function() {
            loadDataOrig.apply(this, arguments);
            loadData.apply(this, arguments);
        };
    } else {
        self.loadData = loadData;
    }

    if (typeof self.reset === 'function') {
        let oldReset = self.reset;

        self.reset = function() {
            oldReset.apply(self, arguments);
            reset();
        };
    } else {
        self.loadData = reset;
    }

    windowSize();
})();