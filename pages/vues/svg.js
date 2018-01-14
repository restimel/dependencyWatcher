(function() {
    const boxPadding = 10;

    const svgBox = {
        props: {
            item: Object,
            types: Object,
            x: {type: Number, default: 0},
            y: {type: Number, default: 0},
            width: {type: Number, default: 200},
            height: {type: Number, default: 20},
        },
        data: function() {
            return {
                padding: boxPadding,
            };
        },
        computed: {
            type: function() {
                const type = this.item.type && this.item.type.name;
                if (type && this.types[type]) {
                    return this.types[type];
                }
                return this.types.undefined;
            },
            color: function() {
                return this.type.color || '#333333';
            },
            bgColor: function() {
                return this.type.bgColor || '#eaeaea';
            },
            xText: function() {
                return this.x + this.padding;
            },
            yText: function () {
                return this.y + this.boxHeight - this.padding;
            },
            boxWidth: function() {
                return this.width + 2 * this.padding;
            },
            boxHeight: function() {
                return this.height;
            },
        },
        template: `
<g @click="$emit('selection', item.name)">
    <rect
        :x="x"
        :y="y"
        :width="boxWidth"
        :height="boxHeight"
        :class="{
            fileItem: true
        }"
        :fill="bgColor"
        :stroke="color"
    ></rect>
    <text
        :x="xText"
        :y="yText"
        :fill="color"
    >
        {{ item.label }}
    </text>
</g>
        `
    };

    const svgBoxes = {
        props: {
            boxes: Array,
            selectedItem: [Array, String],
            types: Object,
            maximumDisplay: {
                type: Number,
                default: 2500,
            },
        },
        computed: {
            activeItem: function() {
                if (!Array.isArray(this.selectedItem)) {
                    return [this.selectedItem];
                } else {
                    return this.selectedItem;
                }
            },
        },
        components: {
            'svg-box': svgBox,
        },
        template: `
<g>
    <svg-box v-for="(item, idx) of boxes"
        :class="{
            active: activeItem.includes(item.name),
        }"
        :item="item"
        :types="types"
        :x="item.x"
        :y="item.y"
        :width="item.width"
        :key="item.name + '-' + idx"
        :height="item.height"
        @selection="(...args)=>$emit('selection', ...args)"
    ></svg-box>
</g>
        `
    };

    const svgArrow = {
        props: {
            arrows: {
                type: Array,
                default: () => ([]),
            },
            itemsList: Map,
            selectedItem: [Array, String],
            maximumDisplay: {
                type: Number,
                default: 1000,
            },
        },
        computed: {
            paths: function() {
                let last;
                return this.arrows.map(arrow => {
                    const order = arrow[0];
                    const path = arrow.slice(1).map(arrow => {
                        const result = this.getSvgPath(order, arrow, last);
                        last = result.last;
                        return result.path;
                    });

                    return path.join(' ');
                });
            },
            parents: function() {
                const list = [];
                this.arrows.forEach((arrow, index) => {
                    if (arrow.get(Infinity)[3] === this.selectedItem) {
                        list.push(index);
                    }
                });
                return list;
            },
        },
        methods: {
            getSvgPath: function(order, arrow, last = []) {
                const item = this.itemsList.get(arrow[3]);
                if (!item) {
                    return {
                        path: '',
                        newLocation: [0, 0],
                    };
                }
                const position = arrow[2];

                const padding = 7;
                const power = 15;
                const x1 = item.x - padding;
                const x2 = item.x + item.width + 2 * boxPadding + padding;

                let newLocation = [];
                let path;

                const y = item.y;
                if (position === -1) {
                    const Y = y + item.height / 2;
                    path = ['M', x2 - padding, Y, 'L', x2, Y];
                    newLocation = [x2, Y];
                } else
                if (position === -2) {
                    const Y = y + item.height / 2;
                    path = ['C', last[0] + order * power, last[1], x1 - power, Y, x1, Y, 'l', padding - 1, 0, -3, -3, 0, 6, 3, -3];
                    newLocation = [x1 + padding, Y];
                } else
                if (order === 1) {
                    const Y = y + item.height + VirtualSVG.wireMarginY + (VirtualSVG.wireMarginY + VirtualSVG.wireHeight) * position;
                    path = ['C', last[0] + power, last[1], x1 - power, Y, x1, Y, 'L', x2, Y];
                    newLocation = [x2, Y];
                } else {
                    const Y = y + item.height + VirtualSVG.wireMarginY + (VirtualSVG.wireMarginY + VirtualSVG.wireHeight) * position;
                    path = ['C', last[0] - power, last[1], x2 + power, Y, x2, Y, 'L', x1, Y];
                    newLocation = [x1, Y];
                }

                return {
                    path: path.join(' '),
                    last: newLocation,
                };
            }
        },
        watch: {arrows: function() {configuration.perfStart('Arrows');}},
        updated: function() {configuration.perfEnd('Arrows');},
        template: `
<g>
    <path v-for="(path, idx) of paths"
        :d="path"
        :class="{
            'arrow-link': true,
            'parentLink': parents.includes(idx),
        }"
        @click="$emit('selection', idx)"
        :key="'pathlink' + idx"
    ></path>
</g>
        `
    };

    Vue.component('chart-svg', {
        props: {
            items: {
                type: Map,
                required: true,
            },
            types: {
                type: Object,
                default: () => ({})
            },
            rootItems: {
                type: Array,
                default: () => ([])
            },
            selectedItem: [Array, String],
        },
        data: function() {
            let sizeX = window.innerWidth - 400;
            let sizeY = window.innerHeight;
            if (sizeX < 1) {
                sizeX = 1;
            }
            if (sizeY < 1) {
                sizeY = 1;
            }
            return {
                sizeX: sizeX,
                sizeY: sizeY,
                WX: 1000,
                X: 0,
                Y: 0,
                mouse: {
                    px: 0,
                    py: 0,
                    X: 0,
                    Y: 0,
                    x: 0,
                    y: 0,
                    move: false,
                },
                crop: {
                    x: 0, y: 0, width: 0, height:0
                },
                hasSelected: '',
                activeItem: this.selectedItem,
                virtualSVG: new VirtualSVG(this.items, this.rootItems),
            };
        },
        computed: {
            WY: function() {
                return this.WX * this.sizeY / this.sizeX;
            },
            viewBox: function() {
                return [this.X, this.Y, this.WX, this.WY].join(' ');
            },
            boxes: function() {
                configuration.perfStart('boxes');
                return Array.from(this.virtualSVG.itemsList).map(elem => elem[1]);
            },
            selectedArrows: function() {
                if (!this.activeItem) {
                    return [];
                } else {
                    const arrows = this.virtualSVG.tooManyArrows ?
                        this.virtualSVG.getArrows():
                        this.virtualSVG.arrows;
                    if (Array.isArray(this.activeItem)) {
                        return arrows.filter(arrow =>
                            arrow.get(1)[3] === this.activeItem[0]
                            && arrow.get(Infinity)[3] === this.activeItem[1]
                        );
                    } else {
                        return arrows.filter(arrow =>
                            arrow.get(1)[3] === this.activeItem
                            || arrow.get(Infinity)[3] === this.activeItem
                        );
                    }
                }
            },
            cropX: function() {
                return this.crop.width < 0 ? this.crop.x + this.crop.width : this.crop.x;
            },
            cropY: function() {
                return this.crop.height < 0 ? this.crop.y + this.crop.height : this.crop.y;
            },
            cropWidth: function() {
                return Math.abs(this.crop.width);
            },
            cropHeight: function() {
                return Math.abs(this.crop.height);
            },
        },
        methods: {
            windowSize: function() {
                this.sizeX = window.innerWidth - 400;
                this.sizeY = window.innerHeight;
                if (this.sizeX < 1) {
                    this.sizeX = 1;
                }
                if (this.sizeY < 1) {
                    this.sizeY = 1;
                }
            },
            reset: function() {
                this.virtualSVG.reset(this.items, this.rootItems);
                this.fitAll();
                if (this.virtualSVG.tooManyBoxes) {
                    this.$emit('status', 'Too many boxes to display. Use filter menu to have less.');
                    this.$emit('addFilter', '-*');
                } else
                if (this.virtualSVG.tooManyArrows) {
                    this.$emit('status', 'Too many arrows to display');
                }
            },
            centerBox: function(x, y) {
                this.X = x - this.WX / 2;
                this.Y = y - this.WY / 2;
            },
            center: function(file) {
                if (!file) {
                    file = this.selectedItem;
                    if (!file) return;
                }
                const selectedItem = this.virtualSVG.itemsList.get(file);
                this.centerBox(selectedItem.x, selectedItem.y);
            },
            fit: function(x, y, width, height) {
                const wx = Math.max(width, height * this.sizeX / this.sizeY);
                if (wx < 2) return;
                this.X = x;
                this.Y = y;
                this.WX = wx;
            },
            fitAll: function() {
                let [x, y, width, height] = this.virtualSVG.bounds;
                x -= VirtualSVG.itemMarginY;
                width += VirtualSVG.itemMarginY * 2 + boxPadding * 2;

                this.fit(x, y, width, height);
            },
            getCoord: function(x, y, origin = [this.X, this.Y]) {
                const ratioX = this.WX / this.sizeX;
                const ratioY = this.WY / this.sizeY;
                const [offsetX, offsetY] = origin;
                return [x * ratioX + offsetX, y * ratioY + offsetY];
            },
            moveBox: function(evt) {
                const [x, y] = this.getCoord(evt.offsetX, evt.offsetY, [this.mouse.X, this.mouse.Y]);
                this.X = this.mouse.X - x + this.mouse.x;
                this.Y = this.mouse.Y - y + this.mouse.y;
            },
            startMove: function(evt) {
                const [px, py] = [evt.offsetX, evt.offsetY];
                const [x, y] = this.getCoord(evt.offsetX, evt.offsetY);
                this.mouse.px = px;
                this.mouse.py = py;
                this.mouse.x = x;
                this.mouse.y = y;
                [this.mouse.X, this.mouse.Y] = [this.X, this.Y];
                this.mouse.move = 'move';
            },
            startCrop: function(evt) {
                const [x, y] = this.getCoord(evt.offsetX, evt.offsetY);
                this.crop.x = x;
                this.crop.y = y;
                this.crop.width = 0;
                this.crop.height = 0;
                this.mouse.move = 'crop';
            },
            mouseMove: function(evt) {
                if (this.mouse.move === 'move') {
                    this.moveBox(evt);
                } else
                if (this.mouse.move === 'crop') {
                    const [x, y] = this.getCoord(evt.offsetX, evt.offsetY);
                    this.crop.width = x - this.crop.x;
                    this.crop.height = y - this.crop.y;
                }
            },
            mouseStopMove: function() {
                if (this.mouse.move === "crop") {
                    this.fit(this.cropX, this.cropY, this.cropWidth, this.cropHeight);
                }
                this.mouse.move = false;
            },
            mouseOut: function(evt) {
                if (this.$el !== evt.target && !this.$el.contains(evt.target)) {
                    this.mouseStopMove();
                }
            },
            mouseWheel: function(evt) {
                let width;
                [this.mouse.X, this.mouse.Y] = [this.X, this.Y];
                [this.mouse.x, this.mouse.y] = this.getCoord(evt.offsetX, evt.offsetY);
                width = this.WX / 10;
                if (width <= 50) {
                    width = 50;
                } else {
                    width -= width % 50;
                }
                if (evt.deltaY < 0) {
                    if (this.WX <= 50) return;
                    this.WX -= width;
                } else {
                    this.WX += width;
                }
                this.moveBox(evt);
            },
            wireSelection: function(arrow) {
                this.activeItem = [
                    arrow.get(1)[3],
                    arrow.get(Infinity)[3]
                ];
            },
        },
        watch: {
            items: function() {
                this.reset();
            },
            selectedItem: function() {
                this.activeItem = this.selectedItem;
                if (this.hasSelected === this.selectedItem) {
                    // avoid centering when click comes from SVG
                    return;
                }
                const selectedItem = this.virtualSVG.itemsList.get(this.selectedItem);
                if (self.configuration.centerOnSelected) {
                    this.centerBox(selectedItem.x, selectedItem.y);
                }
                this.hasSelected = '';
            }
        },
        created: function () {
            window.addEventListener('resize', this.windowSize);
        },
        destroyed: function () {
            window.removeEventListener('resize', this.windowSize);
        },
        updated: function() {
            configuration.perfEnd('boxes');
        },
        components: {
            'svg-boxes': svgBoxes,
            'svg-arrows': svgArrow,
        },
        template: `
<section>
    <svg
        class="draw-area"
        :viewBox="viewBox"
        :width="sizeX"
        :height="sizeY"
        xmlns="http://www.w3.org/2000/svg"
        @mousedown.exact="startMove"
        @mousedown.shift="startCrop"
        @mousemove="mouseMove"
        @mouseout="mouseOut"
        @mouseup="mouseStopMove"
        @wheel="mouseWheel"
        >
        <svg-arrows v-if="!virtualSVG.tooManyArrows"
            :itemsList="virtualSVG.itemsList"
            :arrows="virtualSVG.arrows"
            class="arrows"
            @selection="(idx) => wireSelection(virtualSVG.arrows[idx])"
            @status="(...values) => $emit('status', ...values)"
        ></svg-arrows>
        <svg-arrows
            :itemsList="virtualSVG.itemsList"
            :arrows="selectedArrows"
            :selectedItem="activeItem"
            class="arrows-highlight"
            @selection="(idx) => wireSelection(selectedArrows[idx])"
        ></svg-arrows>
        <svg-boxes v-if="!virtualSVG.tooManyBoxes"
            class="boxes"
            :types="types"
            :selectedItem="activeItem"
            :boxes="boxes"
            @status="(...values) => $emit('status', ...values)"
            @selection="(selection, ...args)=>{
                hasSelected = selection;
                $emit('selection', selection, ...args);
            }"
        ></svg-boxes>
        <rect v-if="mouse.move === 'crop'"
            :x="cropX"
            :y="cropY"
            :width="cropWidth"
            :height="cropHeight"
            class="selection-rectangle"
        ></rect>
    </svg>
    <button
        title="Fit all"
        class="fitAll-btn"
        @click="fitAll"
    ><span class="fa fa-expand"></span></button>
</section>
        `
    });
})();