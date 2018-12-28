(function() {
    'use strict';

    self.configuration = {
        version: '0.6.0',
        centerOnSelected: true,
        maxItemOptionsList: 50,
        workspaces: [],
        performance: false,
        performanceLog: new Map(),
        perfStart: function(label) {
            if (!this.performance) return;
            const currentTime = performance.now();
            console.time(label);
            let log = this.performanceLog.get(label);
            if (!log) {
                log = {label: label, timers: []};
                this.performanceLog.set(label, log);
            }
            if (log.timers.length % 2 === 1) {
                console.warn('Start again ' + label);
                log.timers.pop();
            }
            log.timers.push(currentTime);
        },
        perfEnd: function(label) {
            if (!this.performance) return;
            const currentTime = performance.now();
            console.timeEnd(label);
            let log = this.performanceLog.get(label);
            if (!log || log.timers % 2 === 0) {
                console.warn(label + ' not started');
                return;
            }
            log.timers.push(currentTime);
        },
        save: function() {
            localStorage.setItem('configuration', JSON.stringify({
                centerOnSelected: this.centerOnSelected,
                performance: this.performance,
                workspaces: this.workspaces,
            }));
        },
    };

    Object.assign(self.configuration, JSON.parse(localStorage.getItem('configuration')));

    Vue.directive('focus', {
        inserted: function(el) {
            el.focus();
        },
    });

    Vue.component('configuration', {
        props: {
            selected: [Number, String],
        },
        data: function() {
            return {
                dependencies: [],
            };
        },
        methods: {
            fetchConfiguration: function() {
                fetch('data/configuration.json')
                    .then(response => response.json(), error => notification.set('Failed to retrieve configuration file', error.message, 'error'))
                    .then(response => {
                        this.dependencies = response.dependencies;
                    }, error => notification.set('Failed to parse configuration file', error.message, 'error'));
            },
            change: function(value) {
                this.$emit('changeConfig', value);
            },
            refresh: function() {
                this.$emit('changeConfig', this.selected);
            }
        },
        created: function() {
            this.fetchConfiguration();
        },
        template: `
<div class="confSelectArea">
    <select
        title="Change configuration"
        @change="change($event.target.value)"
    >
        <option v-for="(value, idx) of dependencies"
            :value="idx"
            :selected="selected == idx"
        >
            {{value}}
        </option>
    </select>
    <button
        title="Refresh this configuration"
        @click="refresh"
    >
        <span class="fa fa-refresh"></span>
    </button>
</div>
        `
    });

    const notification = new Vue({
        el: '#notification',
        data: {
            title: '',
            message: '',
            type: 'success',
            timer: 0,
            isActive: false
        },
        computed: {
            classNames: function() {
                const list = [this.type, {
                    active: this.isActive
                }];
                return list;
            }
        },
        methods: {
            set: function(title, message = '', type = 'success') {
                const timer = this.timer;

                if (timer) {
                    clearTimeout(timer);
                }

                let timeout = {
                    'info': 3000,
                    'success': 3000,
                    'warn': 10000,
                    'error': 20000,
                }[type] || 10000;

                this.title = title;
                this.message = message;
                this.isActive = true;
                this.type = type;
                this.timer = setTimeout(() => {
                    this.isActive = false;
                }, timeout);
            }
        },
        template: `
<div class="notification" :class="classNames">
    <header>{{title}}</header>
    <p>{{message}}</p>
    <button @click="isActive = false">&times;</button>
</div>
        `
    });
    self.notification = notification;

    Vue.component('pop-up', {
        props: {
            title: String,
            open: {
                type: Boolean,
                default: true,
            }
        },
        methods: {
            keys: function (evt) {
                if (this.open) {
                    switch (evt.key) {
                        case 'Escape': this.$emit('close'); break;
                        case 'Enter': this.$emit('save'); break;
                    }
                }
            }
        },
        created: function () {
            document.addEventListener('keydown', this.keys);
        },
        destroyed: function () {
            document.removeEventListener('keydown', this.keys);
        },
        template: `
<dialog class="dialog-pop-up" :open="open">
    <header>{{ title }}</header>
    <slot name="content"></slot>
    <menu class="menu-pop-up">
        <slot name="menu">
            <button @click="$emit('close')">Cancel</button>
            <button @click="$emit('save')">Apply</button>
        </slot>
    </menu>
</dialog>
        `
    });

    Vue.component('dependency-watcher', {
        data: function() {
            return {
                display: 'chartPage',
                selectedItem: '',
                items: new Map(),
                types: {},
                configurations: {},
                configuration: -1,
                help: '',
                status: '',
                filters: [],
            };
        },
        computed: {
            visibleItems: function() {
                var items = new Map();
                this.items.forEach((item, key) => {
                    if (item.visible) {
                        items.set(key, item);
                    }
                });
                return items;
            },
            rootItems: function () {
                const rootItems = [];
                const visibleItems = this.visibleItems;
                visibleItems.forEach(item => {
                    if (item.requiredBy.every(reqItem => {
                        return !visibleItems.get(reqItem);
                    })) {
                        rootItems.push(item);
                    }
                });
                return rootItems;
            },
            detailItem: function() {
                return this.selectedItem || (this.rootItems[0] || {}).name;
            },
            fnctfilterRules: function() {
                return this.filterRules.bind(this);
            },
        },
        methods: {
            getItems: function(value) {
                const url = 'data/links.json?configuration=' + value;
                const configurations = this.configurations;

                this.items = new Map();
                self.configuration.perfStart('getItems');
                this.changeStatus('Loading data...');
                fetch(url)
                    .then(response => response.json(), error => {
                        notification.set('Failed to retrieve data file', error.message, 'error');
                    })
                    .then(response => {
                        self.configuration.perfEnd('getItems');
                        self.configuration.perfStart('displayItems');
                        this.items = new Map(response.map(item => [item.name, item]));
                        this.getTypes();
                        this.updateAllVisiblity();
                        this.changeStatus('');
                    }, error => {
                        notification.set('Failed to parse data file', error.message, 'error');
                    });

                if (!configurations[value]) {
                    configurations[value] = {
                        filters: [],
                    };
                }
                this.configuration = value;
                this.filters = configurations[value].filters;
            },
            getTypes: function() {
                const types = {};

                this.items.forEach(item => {
                    if (item.type) {
                        const typeName = item.type.name;

                        if (!types[typeName]) {
                            types[typeName] = Object.assign({
                                list: []
                            }, item.type);
                        }

                        types[typeName].list.push(item.name);
                    }
                });

                this.types = types;
            },
            showHelp: function (help) {
                this.help = help;
            },
            changeSelection: function(value) {
                this.selectedItem = value;
            },
            navigate: function(location, value) {
                const oldDisplay  = this.display;
                switch (location) {
                    case 'code':
                        this.display = 'codePage';
                        if (value) {
                            this.selectedItem = value;
                        }
                        break;
                    case 'chart':
                        this.display = 'chartPage';
                        if (value) {
                            this.selectedItem = value;
                        }
                        break;
                    default:
                        break;
                }
            },
            changeData: function(kind, key, value) {
                switch (kind) {
                    case 'type':
                        this.types[key] = value;
                        break;
                    default:
                        break;
                }
            },
            changeFilter: function(filters) {
                let uid = 0;

                this.filters.splice(0, Infinity, ...filters.map(filter => {
                    return {
                        value: filter,
                        id: 'stored-' + uid++,
                        rules: this.buildFilter(filter),
                    };
                }));
                this.updateAllVisiblity();
            },
            updateAllVisiblity: function() {
                const allFiles = [];
                const items = this.items;
                items.forEach(item => {
                    item.visible = true;
                    allFiles.push(item.name);
                });
                for (const filter of this.filters) {
                    const list = this.filterGetFiles(filter.rules, allFiles);
                    list.forEach(file => {
                        items.get(file).visible = filter.rules.forceAdd;
                    });
                }
                this.items = new Map(Array.from(items)); // to force update
            },
            buildFilter: function(filter) {
                const rules = filter.split('::');
                const rootRule = {
                    subRule: null,
                };
                const parse = /^([-+]?)(?:\[(.*)\])?(.*?)(?::(this|and|children|andchildren|parents|andparents|onlyifnochildren|onlyifnoparents))?$/i;

                const buildRgx = (str) => {
                    str = str || '*';
                    str = str.replace(/([-+?./\\[\](){}^$|])/g, '\\$1')
                             .replace(/\*/g, '.*');
                    return new RegExp('^' + str + '$', 'i');
                };
                const getSubRule = (subRule) => {
                    if ([,'', 'this', 'and'].includes(subRule)) {
                        return 'this';
                    }
                    return subRule;
                };

                let parentRule = rootRule;
                for (const sRule of rules) {
                    const [,forceAdd, group, file, subRule] = parse.exec(sRule);
                    const rule = {
                        group: buildRgx(group),
                        file: buildRgx(file),
                        forceAdd: forceAdd === '+',
                        filter: getSubRule(subRule),
                        subRule: null,
                    };
                    parentRule.subRule = rule;
                    parentRule = rule;
                }

                return rootRule.subRule;
            },
            filterRules: function(filter, items) {
                const rule = this.buildFilter(filter);
                return this.filterGetFiles(rule, items);
            },
            filterGetFiles: function(rule, fileNames = []) {
                let matchFiles = [];
                const items = this.items;

                for (const file of fileNames) {
                    const item = items.get(file);
                    const group = item.type && item.type.name || 'undefined';
                    if (rule.group.test(group) && (rule.file.test(item.name) || rule.file.test(item.label))) {
                        let list = [];
                        switch (rule.filter.toLowerCase()) {
                            case 'parents':
                                list = item.requiredBy;
                                break;
                            case 'andparents':
                                list = [item.name].concat(item.requiredBy);
                                break;
                            case 'children':
                                list = item.dependencies;
                                break;
                            case 'andchildren':
                                list = [item.name].concat(item.dependencies);
                                break;
                            case 'onlyifnochildren':
                                if (!item.dependencies || item.dependencies.length === 0) {
                                    list.push(item.name);
                                }
                                break;
                            case 'onlyifnoparents':
                                if (!item.requiredBy || item.requiredBy.length === 0) {
                                    list.push(item.name);
                                }
                                break;
                            case 'this':
                            default:
                                list.push(item.name);
                        }
                        if (!rule.subRule) {
                            matchFiles.push(...list);
                        } else {
                            matchFiles = matchFiles.concat(
                                this.filterGetFiles(rule.subRule, list)
                            );
                        }
                    }
                }

                return matchFiles;
            },
            addFilter: function(rule) {
                const filters = this.filters;
                const reverseRule = (
                    rule[0] === '-' ? '+' :
                    rule[0] === '+' ? '-' :
                    '+' + rule[0]) + rule.slice(1);
                const idxRuleReverse = filters.findIndex(r => r.value === reverseRule);
                if (idxRuleReverse !== -1) {
                    filters.splice(idxRuleReverse, 1);
                } else {
                    filters.push({
                        value: rule,
                        id: 'autoRule-' + filters.length,
                        rules: this.buildFilter(rule),
                    });
                }

                this.updateAllVisiblity();
            },
            changeStatus: function (status) {
                this.status = status;
            },
            center: function(file) {
                this.$refs.chart.center(file);
            },
            showPath: function(item1, item2) {
                const result = shortestPath(this.items, item1, item2);
                if (result.length === 1) {
                    this.selectedItem = result[0];
                    if (this.filters.length) {
                        this.selectedItem.forEach(itemName => this.addFilter('+' + itemName));
                    }
                } else
                if (result.length > 1) {
                    console.log('TODO: choice multipath');
                } else {
                    notification.set('No relation found', 'These files ("' + item1 + '" and "' + item2 + '") seems to have no relation at all', 'error');
                }
            },
            saveWorkspace: function(name) {
                self.configuration.workspaces.push({
                    name: name,
                    filters: this.filters.map(f => ({
                        id: f.id,
                        value: f.value,
                    })),
                });
                self.configuration.save();
            },
            loadWorkspace: function(name) {
                console.log('loadWorkspace')
                var ws = self.configuration.workspaces.find((ws) => ws.name === name);

                if (ws) {
                    this.filters = [...ws.filters];
                    this.filters.forEach(f => f.rules = this.buildFilter(f.value));
                    this.updateAllVisiblity();
                }
            },
        },
        created: function() {
            this.getItems(0);
        },
        updated: function() {
            self.configuration.perfEnd('displayItems');
        },
        template: `
<div>
    <aside
        class="codeStatus"
        :class="{
            active: !!status
        }"
        @click="changeStatus('')"
    >{{ status }}</aside>
    <chart-svg v-if="display === 'chartPage'"
        class="main-page"
        :items="visibleItems"
        :selectedItem="selectedItem"
        :rootItems="rootItems"
        :types="types"
        @status="changeStatus"
        @selection="changeSelection"
        @addFilter="addFilter"
        ref="chart"
    ></chart-svg>
    <code-page v-else
        class="main-page"
        :items="items"
        :selectedItem="detailItem"
        @status="changeStatus"
        @navigate="navigate"
    ></code-page>

    <aside class="">
        <filter-form
            :items="items"
            :selectedItem="selectedItem"
            :filters="filters"
            :filterRules="fnctfilterRules"
            @selection="changeSelection"
            @saveFilter="changeFilter"
            @showHelp="showHelp"
        ></filter-form>
        <aside-content
            :selectedItems="detailItem"
            :items="items"
            :types="types"
            :help="help"
            @selection="changeSelection"
            @navigate="navigate"
            @change="changeData"
            @addFilter="addFilter"
            @center="center"
            @showPath="showPath"
            @saveWorkspace="saveWorkspace"
            @loadWorkspace="loadWorkspace"
        ></aside-content>
        <configuration
            :selected="configuration"
            @changeConfig="getItems"
        ></configuration>
    </aside>
</div>
        `
    });

    new Vue({
        el: '#appDependencyWatcher',
    });
})();
