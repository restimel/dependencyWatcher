(function() {
    const fileLi = {
        props: {
            file: String,
            items: Array,
        },
        computed: {
            item: function() {
                return this.items.find(item => item.name === this.file);
            }
        },
        template: `
<li
    class="linkToItem"
    :title="item.name"
    @click="$emit('click', file)"
>
    {{ item.label }}
</li>
        `
    };

    Vue.component('file-list', {
        props: {
            files: {
                type: Array,
                default: () => ([])
            },
            items: {
                type: Array,
                default: () => ([])
            },
            selectedItem: String
        },
        components: {
            'file-li': fileLi,
        },
        template: `
<ul v-if="files.length > 0">
    <file-li v-for="file of files"
        :class="{
            active: file === selectedItem
        }"
        :items="items"
        :file="file"
        @click="$emit('selection', file)"
        :key="file"
    ></file-li>
</ul>
<span v-else class="no-file">No files</span>
        `
    });

    const details = {
        props: {
            itemData: Object,
            items: Array,
        },
        computed: {
            item: function() {
                return this.itemData || {};
            },
            title: function() {
                return this.item.label || 'no file selected';
            },
            subTitle: function() {
                return this.item.label === this.item.name ? '' : this.item.name;
            },
            depLength: function () {
                return this.item.dependencies && this.item.dependencies.length || 0;
            },
            reqLength: function () {
                return this.item.requiredBy && this.item.requiredBy.length || 0;
            },
            isReadable: function() {
                return this.item.canReadFile;
            },
        },
        watch: {
            itemData: function() {
                this.$el.scrollTop = 0;
            }
        },
        template: `
<div class="tabContent">
    <header>
        <h3><span>{{ title }}</span></h3>
        <h5><span>{{ subTitle }}</span></h5>
    </header>
    <details>
        <summary>Dependencies (<span>{{ depLength }}</span>)</summary>
        <file-list
            :files="item.dependencies"
            :items="items"
            @selection="(value)=>$emit('selection', value)"
        ></file-list>
    </details>
    <details>
        <summary>Required by (<span>{{ reqLength }}</span>)</summary>
        <file-list
            :files="item.requiredBy"
            :items="items"
            @selection="(value)=>$emit('selection', value)"
        ></file-list>
    </details>
    <br>
    <footer>
        <button
            v-if="isReadable"
            @click="$emit('navigate', 'code', item.name)"
        >
            <span class="fa fa-file-code-o"></span>
        </button>
    </footer>
</div>
        `
    };

    const colorDialog = {
        props: {
            editColor: String,
            types: Object,
        },
        data: function() {
            return {
                color: '#333333',
                bgColor: '#eaeaea',
            };
        },
        computed: {
            isOpen: function() {
                return !!this.editColor;
            },
            type: function() {
                return this.types[this.editColor] || {};
            }
        },
        methods: {
            close: function() {
                this.$emit('close');
            },
            save: function() {
                this.$emit('change', 'type', this.editColor, Object.assign({}, this.type, {
                    color: this.color,
                    bgColor: this.bgColor
                }));
                this.close();
            },
            keys: function(evt) {
                if (this.isOpen) {
                    switch(evt.key) {
                        case 'Escape': this.close(); break;
                        case 'Enter': this.save(); break;
                    }
                }
            }
        },
        watch: {
            editColor: function() {
                this.color = this.type.color || '#333333';
                this.bgColor = this.type.bgColor || '#eaeaea';
            }
        },
        created: function() {
            document.addEventListener('keydown', this.keys);
        },
        destroyed: function() {
            document.removeEventListener('keydown', this.keys);
        },
        template: `
<dialog class="dialogTypeColor" :open="isOpen">
    <header>{{ type.name }}</header>
    <label>Color (for text and border): <input type="color" v-model="color"></label>
    <label>Background color: <input type="color" v-model="bgColor"></label>
    <menu>
        <button @click="close">Cancel</button>
        <button @click="save">Apply</button>
    </menu>
</dialog>
        `
    };

    const groups = {
        props: {
            itemData: Object,
            items: Array,
            types: Object,
        },
        data: function() {
            return {
                editColor: ''
            };
        },
        methods: {
            changeColor: function(groupName) {
                this.editColor = groupName;
            }
        },
        components: {
            'group-color-dialog': colorDialog
        },
        template: `
<div class="tabContent" data-tab="groups">
    <header>Groups</header>
    <details v-for="group in types"
        class="groupDetail"
    >
        <summary>
            <div class="colorBox"
                :style="{
                    'background-color': group.bgColor
 || '#eaeaea',
                    'border-color': group.color || '#333333',
                }"
                @click="changeColor(group.name)"
            ></div>
            <label>{{ group.name }}</label>
        </summary>
        <file-list
            :files="group.list"
            :items="items"
            :selectedItem="itemData && itemData.name"
            @selection="(value)=>$emit('selection', value)"
        ></file-list>
    </details>
    <group-color-dialog
        :editColor="editColor"
        :types="types"
        @close="editColor=''"
        @change="(...args)=>$emit('change', ...args)"
    ></group-color-dialog>
</div>
        `
    };

    Vue.component('aside-content', {
        props: {
            selectedItem: String,
            items: Array,
            types: Object,
        },
        data: function() {
            return {
                activeTab: 'item-details',
                tabs: [{
                    name: 'Details',
                    id: 'item-details'
                }, {
                    name: 'Groups',
                    id: 'item-groups'
                }]
            };
        },
        computed: {
            dataSelected: function() {
                return this.items.find((item) => {
                    return item.name === this.selectedItem;
                });
            }
        },
        methods: {
            changeTab: function(tab) {
                this.activeTab = tab;
            }
        },
        components: {
            'item-details': details,
            'item-groups': groups,
        },
        template: `
<section>
    <div :is="activeTab"
        :item="selectedItem"
        :itemData="dataSelected"
        :items="items"
        :types="types"
        @selection="(value)=>$emit('selection', value)"
        @navigate="(location, value) =>$emit('navigate', location, value)"
        @change="(...args)=>$emit('change', ...args)"
    ></div>
    <footer class="tabsSelection">
        <ul>
            <li v-for="tab of tabs"
                :class="{active: activeTab === tab.id}"
                :key="tab.id"
                @click="changeTab(tab.id)"
            >{{tab.name}}</li>
        </ul>
    </footer>
</section>
        `
    });
})();