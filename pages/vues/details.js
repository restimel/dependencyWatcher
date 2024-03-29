import configuration from '/scripts/configuration.js';

const visibilityIcon = {
    props: {
        visible: Boolean,
        rule: String,
    },
    computed: {
        classNames: function () {
            if (this.visible) {
                return 'fa-eye';
            } else {
                return 'fa-eye-slash';
            }
        },
        iconTitle: function () {
            return this.visible ?
                'Hide this box':
                'Show this box';
        },
    },
    methods: {
        showHide: function () {
            const addRule = this.visible ? '-' : '+';
            this.$emit('addFilter', addRule + this.rule);
        }
    },
    template: `
<span
    class="change-visibility fa"
    :class="classNames"
    :title="iconTitle"
    @click.stop.prevent="showHide"
></span>
    `
};

const fileLi = {
    props: {
        file: String,
        items: Map,
    },
    computed: {
        item: function() {
            return this.items.get(this.file);
        },
    },
    components: {
        'visibility-icon': visibilityIcon,
    },
    template: `
<li
    class="linkToItem"
    :title="item.name"
    @click="$emit('click', file)"
>
    <span class="flex">
        {{ item.label }}
        <visibility-icon
            :visible="item.visible"
            :rule="item.name"
            @addFilter="(...values) => $emit('addFilter', ...values)"
        />
    </span>
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
            type: Map,
            required: true,
        },
        selectedItem: String
    },
    data: function () {
        return {
            showHidden: false,
        };
    },
    computed: {
        filesFiltered: function() {
            let list = this.files;

            if (!this.showHidden) {
                const items = this.items;
                list = list.filter(file => {
                    const item = items.get(file);
                    return item && item.visible;
                });
            }

            const ids = new Set();
            list = list.filter((file) => {
                if (ids.has(file)) {
                    return false;
                }
                ids.add(file);
                return true;
            });

            return list;
        },
        nbHidden: function() {
            return this.files.length - this.filesFiltered.length;
        },
    },
    components: {
        'file-li': fileLi,
        'visibility-icon': visibilityIcon,
    },
    template: `
<ul v-if="files.length > 0">
    <file-li v-for="file of filesFiltered"
        :class="{
            active: file === selectedItem
        }"
        :items="items"
        :file="file"
        @click="$emit('selection', file)"
        @addFilter="(...values)=>$emit('addFilter', ...values)"
        :key="'list--' + file"
    ></file-li>
    <li v-if="nbHidden > 0"
        class="linkToItem"
        title="Show hidden files"
        @click="showHidden=true"
    >
        <span class="flex">
            + {{ nbHidden }} hidden files...
            <visibility-icon
                :visible="false"
                @addFilter="showHidden=true"
            />
        </span>
    </li>
</ul>
<span v-else class="no-file">No files</span>
    `
});

const details = {
    props: {
        itemData: Object,
        items: Map,
    },
    computed: {
        item: function() {
            return this.itemData || {};
        },
        title: function() {
            return this.item.label || 'no file selected';
        },
        subTitle: function() {
            const name = this.item.name;
            return this.item.label === name ? '' : name;
        },
        pathTitle: function() {
            return this.item.shortPath || '';
        },
        depLength: function () {
            const dependencies = this.item.dependencies;
            return dependencies && dependencies.length || 0;
        },
        reqLength: function () {
            const requiredBy = this.item.requiredBy;
            return requiredBy && requiredBy.length || 0;
        },
        isReadable: function() {
            return this.item.canReadFile;
        },
        visibleDep: function() {
            const item = this.item;
            const items = this.items;
            const dependencies = item.dependencies || [];
            return {
                show: !!dependencies.length,
                visible: dependencies.some(file => {
                    const fileItem = items.get(file);
                    return fileItem && fileItem.visible;
                }),
                rule: item.name + ':children::',
            };
        },
        visibleReq: function() {
            const item = this.item;
            const items = this.items;
            const requiredBy = item.requiredBy || [];
            return {
                show: !!requiredBy.length,
                visible: requiredBy.some(file => {
                    const fileItem = items.get(file);
                    return fileItem && fileItem.visible;
                }),
                rule: item.name + ':parents::',
            };
        },
    },
    watch: {
        itemData: function() {
            this.$el.scrollTop = 0;
        }
    },
    components: {
        'visibility-icon': visibilityIcon,
    },
    template: `
<div>
    <header
        :class="{notVisible: !item.visible}"
        :title="pathTitle"
    >
        <h3><span>{{ title }}</span></h3>
        <h5><span>{{ subTitle }}</span></h5>
    </header>
    <section>
        <details>
            <summary>
                <span class="flex">
                    <span>Dependencies (<span>{{ depLength }}</span>)</span>
                    <visibility-icon
                        v-show="visibleDep.show"
                        class="in-summary"
                        :visible="visibleDep.visible"
                        :rule="visibleDep.rule"
                        @addFilter="(...values)=>$emit('addFilter', ...values)"
                    />
                </span>
            </summary>
            <file-list
                :files="item.dependencies"
                :items="items"
                @selection="(value)=>$emit('selection', value)"
                @addFilter="(...values)=>$emit('addFilter', ...values)"
            ></file-list>
        </details>
        <details>
            <summary>
                <span class="flex">
                    <span>Required by (<span>{{ reqLength }}</span>)</span>
                    <visibility-icon
                        v-show="visibleReq.show"
                        class="in-summary"
                        :visible="visibleReq.visible"
                        :rule="visibleReq.rule"
                        @addFilter="(...values)=>$emit('addFilter', ...values)"
                    />
                </span>
            </summary>
            <file-list
                :files="item.requiredBy"
                :items="items"
                @selection="(value)=>$emit('selection', value)"
                @addFilter="(...values)=>$emit('addFilter', ...values)"
            ></file-list>
        </details>
    </section>
    <footer class="btn-actions">
        <button v-if="item.name"
            title="Center on this box"
            @click="$emit('center', item.name)"
        >
            <span class="fa fa-dot-circle-o"></span>
        </button>
        <button v-if="isReadable"
            title="Display code of this file"
            @click="$emit('navigate', 'code', item.name)"
        >
            <span class="fa fa-file-code-o"></span>
        </button>
        <button v-if="item.name"
            title="Search a relation from this file to another"
            @click="$emit('prepareShowPath', item.name)"
        >
            <span class="fa fa-share-alt"></span>
        </button>
        <button v-if="item.visible"
            title="Hide this file"
            @click="$emit('addFilter', '-' + item.name)"
        >
            <span class="fa fa-eye-slash"></span>
        </button>
        <button v-if="item.visible === false"
            title="Show this file"
            @click="$emit('addFilter', '+' + item.name)"
        >
            <span class="fa fa-eye"></span>
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
            const type = this.type;
            this.color = type.color || '#333333';
            this.bgColor = type.bgColor || '#eaeaea';
        }
    },
    template: `
<pop-up
    class="dialogTypeColor"
    :open="isOpen"
    :title="type.name"
    @close="close"
    @save="save"
>
    <template slot="content">
        <label>Color (for text and border): <input type="color" v-model="color"></label>
        <label>Background color: <input type="color" v-model="bgColor"></label>
    </template>
</pop-up>
    `
};

const groups = {
    props: {
        itemData: Object,
        items: Map,
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
        'group-color-dialog': colorDialog,
        'visibility-icon': visibilityIcon,
    },
    template: `
<div data-tab="groups">
    <header>Groups</header>
    <section>
        <details v-for="group in types"
            class="groupDetail"
        >
            <summary>
                <span class="flex">
                    <span>
                        <div class="colorBox"
                            :style="{
                                'background-color': group.bgColor || '#eaeaea',
                                'border-color': group.color || '#333333',
                            }"
                            @click="changeColor(group.name)"
                        ></div>
                        <label>{{ group.name }} (<span>{{ group.list.length }}</span>)</label>
                    </span>
                    <visibility-icon
                        v-show="group.list.length > 0"
                        class="in-summary"
                        :visible="group.list.some(file => {const item = items.get(file); return item && item.visible;})"
                        :rule="'[' + group.name + ']'"
                        @addFilter="(...values)=>$emit('addFilter', ...values)"
                    />
                </span>
            </summary>
            <file-list
                :files="group.list"
                :items="items"
                :selectedItem="itemData && itemData.name"
                @selection="(value)=>$emit('selection', value)"
                @addFilter="(...values)=>$emit('addFilter', ...values)"
            ></file-list>
        </details>
        <group-color-dialog
            :editColor="editColor"
            :types="types"
            @close="editColor=''"
            @change="(...args)=>$emit('change', ...args)"
        ></group-color-dialog>
    </section>
</div>
    `
};

const askName = {
    props: {
        show: Boolean,
        types: Object,
    },
    data: function() {
        return {};
    },
    computed: {
        isOpen: function() {
            return !!this.show;
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
            const type = this.type;
            this.color = type.color || '#333333';
            this.bgColor = type.bgColor || '#eaeaea';
        }
    },
    template: `
<pop-up
    class="dialogTypeColor"
    :open="isOpen"
    :title="type.name"
    @close="close"
    @save="save"
>
    <template slot="content">
        <label>Color (for text and border): <input type="color" v-model="color"></label>
        <label>Background color: <input type="color" v-model="bgColor"></label>
    </template>
</pop-up>

    `
};

const workspaces = {
    props: {
        itemData: Object,
        items: Map,
    },
    data: function() {
        return {
            workspaces: configuration.workspaces,
            isDialogOpen: false,
            wsName: '',
        };
    },
    computed: {
        isEmpty: function() {
            return this.workspaces.length === 0;
        },
    },
    methods: {
        askForName: function() {
            this.isDialogOpen = true;
        },
        save: function() {
            this.saveToConfig(this.wsName);
            this.close();
        },
        saveToConfig: function(name) {
            this.$emit('saveWorkspace', name);
        },
        remove: function(name) {
            const workspaces = configuration.workspaces;
            const index = workspaces.findIndex(w => w.name === name);
            if (index >= 0) {
                workspaces.splice(index, 1);
            }
        },

        close: function() {
            this.isDialogOpen = false;
        },
    },
    components: {
    },
    template: `
<div data-tab="groups">
    <header>Workspaces</header>
    <section>
        <p class="help-content">Workspaces are set of filter. You can save the current filter configuration and restore it at any time.</p>
        <div v-if="isEmpty" class="isEmpty groupDetail">
            There are currently no workspaces saved.
        </div>
        <ul v-else>
            <li v-for="ws in workspaces"
                :keys="ws.name"
                class="groupDetail link-item"
                @click="$emit('loadWorkspace', ws.name)"
            >
                <span class="flex">
                    {{ws.name}}
                    <span
                        class="item-icon fa fa-trash"
                        title="remove this workspace"
                        @click.stop.prevent="remove(ws.name)"
                    ></span>
                </span>
            </li>
        </ul>

        <div class="btn-actions">
            <button
                title="Save current workspace"
                @click="askForName"
            >
                <span class="fa fa-save"></span>
            </button>
        </div>
    </section>
    <pop-up
        class="dialogTypeColor"
        :open="isDialogOpen"
        title="Enter workspace information"
        :backgroundMask="true"
        @close="close"
        @save="save"
    >
        <template slot="content">
            <label>Name of the workspace: <input type="text" v-model="wsName"></label>
        </template>
    </pop-up>
</div>
    `
};

const prepareShowPath = {
    props: {
        items: Map,
        saveData: Object,
    },
    data: function() {
        return {
            item2: '',
            hasSubmit: false,
        };
    },
    computed: {
        item1: function() {
            return this.saveData.item1;
        },
        hasError: function() {
            const item2 = this.item2;
            return (this.hasSubmit && (!item2 || !this.items.has(item2))) || item2 === this.item1;
        },
    },
    methods: {
        submitted: function() {
            this.hasSubmit = true;
            if (!this.hasError) {
                this.$emit('showPath', this.item1, this.item2);
            }
        },
        cancel: function() {
            this.$emit('gotoLastView');
        },
    },
    template: `
<div>
    <header>Look for linked path</header>
    <form
        @submit.prevent
    >
        <label
            title="The file from which to find links"
        >
            From
            <input
                type="text"
                :value="item1"
                readonly
            >
        </label>
        <br>
        <label
            title="The other file"
        >
            To
            <search-files
                class="path-file-item2"
                :class="{'border-error': hasError}"
                v-model="item2"
                :items="items"
                @submitted="submitted"
            />

        </label>
        <br><br>
        <hr>
        <footer class="btn-actions">
            <button @click.prevent="submitted" title="Search"><span class="fa fa-search"></span></button>
            <button @click.prevent="cancel" title="Cancel"><span class="fa fa-times"></span></button>
        </footer>
    </form>
</div>
    `
};

const configurationTab = {
    data: function() {
        return {
            configuration: configuration,
        };
    },
    updated: function(){
        this.configuration.save();
    },
    template: `
<div>
    <header>Configuration</header>
    <form
        @submit.prevent
    >
        <label
            title="When ticked, the selected box is centered (but not when selected from chart)"
        >
            <input
                type="checkbox"
                v-model="configuration.centerOnSelected"
            >
            Center on selected item
        </label>
        <br>
        <label
            title="Search field displays only this maximum number of propositions"
        >
            Maximum search proposition
            <input
                type="number"
                v-model="configuration.maxItemOptionsList"
            >
        </label>
        <br><br>
        <details>
            <summary>Debug</summary>
            <label>
                <input
                    type="checkbox"
                    v-model="configuration.performance"
                >
                Performance log
            </label>
        </details>
        <br><hr>
        version {{configuration.version}}
    </form>
</div>
    `
};

const listTab = {
    props: {
        itemData: Object,
        items: Map,
    },
    data: function() {
        return {
            show: 'fullName',
        };
    },
    computed: {
        visibleItems() {
            return Array.from(this.items.values()).filter((item) => item.visible);
        },
        listItems() {
            return this.visibleItems.map((item) => {
                switch(this.show) {
                    case 'label': return item.label;
                    case 'fullName':
                    default: return item.name;
                }
            }).join('\n');
        },
    },
    template: `
<div>
    <header>List visible items</header>
    <form
        class="list__form-container"
        @submit.prevent
    >
        <textarea
            class="list-area"
            placeholder="No items are visible yet"
            readonly
        >{{listItems}}</textarea>
        <fieldset>
            <legend>Display</legend>
            <label><input type="radio" name="list-method" :checked="show==='fullName'" @input="show='fullName'">
                Full-name
            </label><br>
            <label><input type="radio" name="list-method" :checked="show==='label'" @input="show='label'">
                Label
            </label><br>
        </fieldset>
    </form>
</div>
    `
};

Vue.component('aside-content', {
    props: {
        selectedItems: [String, Array],
        items: Map,
        types: Object,
        help: String,
    },
    data: function() {
        return {
            saveData: {},
            selectedTab: 'item-details',
            tabs: [{
                name: 'Details',
                id: 'item-details',
                visible: true,
            }, {
                name: 'Groups',
                id: 'item-groups',
                visible: true,
            }, {
                name: 'Workspaces',
                id: 'item-workspaces',
                visible: true,
            }, {
                name: '',
                className: 'fa fa-list',
                id: 'tab-list',
                visible: true,
            }, {
                name: '',
                className: 'fa fa-cog',
                id: 'tab-configuration',
                visible: true,
            }, {
                name: '',
                id: 'item-prepare-show-path',
                visible: false,
            }]
        };
    },
    computed: {
        selectedItem: function() {
            const selectedItems = this.selectedItems;
            return selectedItems instanceof Array ? selectedItems[0] : selectedItems;
        },
        activeTab: function() {
            let activeTab;
            const help = this.help;

            if (help) {
                activeTab = this.tabs.find(tab => tab.name === help);
                activeTab = activeTab && activeTab.id;
            }

            return activeTab || this.selectedTab;
        },
        dataSelected: function() {
            return this.items.get(this.selectedItem);
        },
        visibleTabs: function() {
            return this.tabs.filter(tab => tab.visible);
        }
    },
    methods: {
        changeTab: function(tab) {
            this.selectedTab = tab;
        },
        prepareShowPath: function(item1) {
            this.saveData = {
                item1: item1,
                lastView: this.selectedTab,
            };
            this.selectedTab = 'item-prepare-show-path';
        },
        showPath: function(item1, item2) {
            this.gotoLastView();
            this.$emit('showPath', item1, item2);
        },
        gotoLastView: function() {
            this.selectedTab = this.saveData.lastView;
            this.saveData = {};
        },
    },
    components: {
        'item-details': details,
        'item-groups': groups,
        'item-workspaces': workspaces,
        'tab-configuration': configurationTab,
        'tab-list': listTab,
        'item-prepare-show-path': prepareShowPath,
    },
    template: `
<section>
    <div :is="activeTab"
        class="tabContent"
        :item="selectedItem"
        :itemData="dataSelected"
        :items="items"
        :types="types"
        :saveData="saveData"
        @selection="(value)=>$emit('selection', value)"
        @navigate="(location, value) =>$emit('navigate', location, value)"
        @change="(...args)=>$emit('change', ...args)"
        @addFilter="(...values)=>$emit('addFilter', ...values)"
        @center="(...values)=>$emit('center', ...values)"
        @saveWorkspace="(...values)=>$emit('saveWorkspace', ...values)"
        @loadWorkspace="(...values)=>$emit('loadWorkspace', ...values)"
        @prepareShowPath="prepareShowPath"
        @showPath="showPath"
        @gotoLastView="gotoLastView"
    ></div>
    <footer class="tabsSelection">
        <ul>
            <li v-for="tab of visibleTabs"
                :class="{active: activeTab === tab.id}"
                :key="tab.id"
                @click="changeTab(tab.id)"
            >
                <span v-if="tab.className" :class="tab.className"></span>
                {{tab.name}}
            </li>
        </ul>
    </footer>
</section>
    `
});
