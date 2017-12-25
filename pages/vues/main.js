(function() {
    'use strict';

    Vue.component('configuration', {
        data: function() {
            return {
                dependencies: [],
            };
        },
        methods: {
            fetchConfiguration: function() {
                fetch('data/configuration.json')
                    .then(response => response.json(), error => notification.set('Failed to retrieve configuration file', error.message, 'danger'))
                    .then(response => {
                        this.dependencies = response.dependencies;
                    }, error => notification.set('Failed to parse configuration file', error.message, 'danger'));
            },
            change: function(value) {
                this.$emit('changeConfig', value);
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
        >
            {{value}}
        </option>
    </select>
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
                const list = ['notification', this.type];
                if (this.isActive) {
                    list.push('active');
                }
                return list;
            }
        },
        methods: {
            set: function(title, message = '', type = 'success') {
                if (this.timer) {
                    clearTimeout(this.timer);
                }

                let timeout = {
                    'success': 3000,
                    'warn': 10000,
                    'danger': 20000
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
<div :class="classNames">
    <header>{{title}}</header>
    <p>{{message}}</p>
    <button @click="isActive = false">&times;</button>
</div>
        `
    });
    self.notification = notification;


    new Vue({
        el: '#appDependencyWatcher',
        data: {
            display: 'chartPage',
            selectedItem: '',
            items: [],
            types: {},
        },
        computed: {
            rootItems: function () {
                return this.items.filter(item => {
                    return item.requiredBy.length === 0;
                });
            },
            detailItem: function() {
                return this.selectedItem || (this.rootItems[0] || {}).name;
            },
        },
        methods: {
            getItems: function(value) {
                const url = 'data/links.json?configuration=' + value;

                this.items = [];
                fetch(url)
                    .then(response => response.json(), error => {
                        notification.set('Failed to retrieve data file', error.message, 'danger');
                    })
                    .then(response => {
                        this.items = response;
                        this.getTypes();
                    }, error => {
                        notification.set('Failed to parse data file', error.message, 'danger');
                    });
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
            changeSelection: function(value) {
                this.selectedItem = value;
            },
            navigate: function(location, value) {
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
        },
        created: function() {
            this.getItems(0);
        },
        template: `
<div>
    <chart-svg v-if="display === 'chartPage'"
        class="main-page"
        :items="items"
        :selectedItem="selectedItem"
        :rootItems="rootItems"
        :types="types"
        @selection="changeSelection"
    ></chart-svg>
    <code-page v-else
        class="main-page"
        :items="items"
        :selectedItem="detailItem"
    ></code-page>

    <aside class="">
        <filter-form
            :items="items"
            :selectedItem="selectedItem"
            @selection="changeSelection"
        ></filter-form>
        <aside-content
            :selectedItem="detailItem"
            :items="items"
            :types="types"
            @selection="changeSelection"
            @navigate="navigate"
            @change="changeData"
        ></aside-content>
        <configuration @changeConfig="getItems"></configuration>
    </aside>
</div>
        `
    });
})();
