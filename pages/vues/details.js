(function() {
    const visibilityIcon = {
        props: {
            visible: Boolean,
            rule: String,
        },
        computed: {
            classNames: function () {
                const classNames = ['change-visibility', 'fa'];
                if (this.visible) {
                    classNames.push('fa-eye');
                } else {
                    classNames.push('fa-eye-slash');
                }
                return classNames;
            },
            iconTitle: function () {
                return this.visible ?
                    'Hide this box' :
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
        @addFilter="(...values)=>$emit('addFilter', ...values)"
        :key="file"
    ></file-li>
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
            visibleDep: function() {
                const dependencies = this.item.dependencies || [];
                return {
                    show: !!dependencies.length,
                    visible: dependencies.some(item => this.items.get(item).visible),
                    rule: this.item.name + ':children::',
                };
            },
            visibleReq: function() {
                const requiredBy = this.item.requiredBy || [];
                return {
                    show: !!requiredBy.length,
                    visible: requiredBy.some(item => this.items.get(item).visible),
                    rule: this.item.name + ':parents::',
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
    <header>
        <h3><span>{{ title }}</span></h3>
        <h5><span>{{ subTitle }}</span></h5>
    </header>
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
    <br>
    <footer class="file-actions">
        <button
            v-if="item.name"
            title="Center on this box"
            @click="$emit('center', item.name)"
        >
            <span class="fa fa-dot-circle-o"></span>
        </button>
        <button
            v-if="isReadable"
            title="Display code of this file"
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
                    <label>{{ group.name }}</label>
                </span>
                <visibility-icon
                    v-show="group.list.length > 0"
                    class="in-summary"
                    :visible="group.list.some(file => items.get(file).visible)"
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
</div>
        `
    };

    const filterHelp = {
        template: `
<div>
    <header>How to create filter</header>
    <p>All file boxes which match a rule will not be displayed.</p>
    <h4>Syntax</h4>
    <p><code class="example">[group]file:modifier::&lt;SubRule&gt;</code></p>
    <table>
        <tr>
            <th>Modifier name</th>
            <th>Explanation</th>
        </tr>
        <tr>
            <td>:children::</td>
            <td>Select children of selected file box</td>
        </tr>
        <tr>
            <td>:andChildren::</td>
            <td>Select children of selected file box and this file box</td>
        </tr>
        <tr>
            <td>:parents::</td>
            <td>Select parents of selected file box</td>
        </tr>
        <tr>
            <td>:andParents::</td>
            <td>Select parents of selected file box and this file box</td>
        </tr>
        <tr>
            <td>:and::</td>
            <td>Select this file box (to add another rule)</td>
        </tr>
    </table>
    <p>It is possible to start the rule with '+' to force the visibility of matching boxes.
    <h4>Some examples</h4>
    <ul>
        <li><code class="example">*.min.js</code> Do not display files which end with ".min.js".</li>
        <li><code class="example">[modules]:andChildren::</code> Do not display files in "modules" group and their children.</li>
        <li><code class="example">[filter-*]*leaf.js:children::*.html</code> Do not display all children which end with ".html" of files ending by ".js" in groups startings with "filter-".</li>
    </ul>
</div>
        `
    };

    const configurationTab = {
        data: function() {
            return {
                configuration: self.configuration,
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
    </form>
</div>
        `
    };

    Vue.component('aside-content', {
        props: {
            selectedItem: String,
            items: Map,
            types: Object,
            help: String,
        },
        data: function() {
            return {
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
                    name: '',
                    className: 'fa fa-cog',
                    id: 'tab-configuration',
                    visible: true,
                }, {
                    name: 'Filter',
                    id: 'item-filter',
                    visible: false,
                }]
            };
        },
        computed: {
            activeTab: function() {
                let activeTab;

                if (this.help) {
                    activeTab = this.tabs.find(tab => tab.name === this.help);
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
            }
        },
        components: {
            'item-details': details,
            'item-groups': groups,
            'item-filter': filterHelp,
            'tab-configuration': configurationTab,
        },
        template: `
<section>
    <div :is="activeTab"
        class="tabContent"
        :item="selectedItem"
        :itemData="dataSelected"
        :items="items"
        :types="types"
        @selection="(value)=>$emit('selection', value)"
        @navigate="(location, value) =>$emit('navigate', location, value)"
        @change="(...args)=>$emit('change', ...args)"
        @addFilter="(...values)=>$emit('addFilter', ...values)"
        @center="(...values)=>$emit('center', ...values)"
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
})();