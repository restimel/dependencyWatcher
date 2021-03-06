import configuration from '/scripts/configuration.js';

let uid = 0;
const filterItem = {
	props: {
		filter: {
			type: String,
			required: true,
		},
		filterRules: {
			type: Function,
			required: true,
		},
		items: Map,
	},
	data: function() {
		const filter = this.filter;
		return {
			status: filter ? 'display' : 'edit',
			hover: false,
			value: filter,
			suggestIdx: 0,
		};
	},
	computed: {
		suggestion: function() {
			const text = this.value;

			if (!text) {
				return [''];
			} else {
				let list = [];
				const rules = text.split('::');
				const currentRules = rules.slice(0, -1).join('::');
				const strRules = currentRules ? currentRules + '::' : '';
				const last = rules.get(Infinity);
				const itemNames = this.itemNames;
				const items = this.items;

				if (!last) {
					list = ['['];
				} else
				if (/^\[[^\]]*?$/.test(last)) {
					list = this.filterRules(currentRules, itemNames);
					list = list.reduce((list, item) => {
						let type = items.get(item).type;
						type = '[' + (type && type.name || 'undefined') + ']';

						if (type.startsWith(last) && !list.includes(type)) {
							list.push(type);
						}
						return list;
					}, []);
				} else
				if (/^(?:\[[^\]]*?\])?[^:]*?$/.test(last)) {
					const itemNames = this.itemNames;
					const group = last.replace(/^(\[[^\]]*?\])?.*$/, '$1');
					const file = last.slice(group.length);

					list = this.filterRules(currentRules + '::' + group, itemNames);
					list = list.reduce((list, item) => {
						let suggest = group + item;
						if (item.startsWith(file) && !list.includes(suggest)) {
							list.push(suggest);
						}
						const label = (items.get(item) || {}).label;
						suggest = group + label;
						if (label.startsWith(file) && !list.includes(suggest)) {
							list.push(suggest);
						}
						return list;
					}, []);
				} else
				if (/^(?:\[[^\]]*?\])?[^:]*?:[^:]*:?$/.test(last)) {
					const file = last.replace(/:[^:]*:?$/, '');
					const subRule = last.slice(file.length);
					list = [':children::', ':andChildren::', ':parents::', ':andParents::', ':and::', ':onlyIfNoChildren::', ':onlyIfNoParents::'].reduce((list, sub) => {
						if (sub.startsWith(subRule)) {
							list.push(file + sub);
						}
						return list;
					}, []);
				}

				list = list.map(l => strRules + l);
				return list;
			}
		},
		suggest: function() {
			if (!this.value) {
				return 'Enter filter rule here';
			}
			return this.suggestion[this.suggestIdx] || '';
		},
		itemNames: function() {
			const list = [];
			this.items.forEach(item => list.push(item.name));
			return list;
		},
		title: function() {
			var filters = this.filterRules(this.value, this.itemNames);
			return ['match ' + filters.length + ' files'];
		},
	},
	methods: {
		submitted: function() {
			if (this.value) {
				this.status = 'display';
			}
		},
		incSuggestIndex: function() {
			this.suggestIdx = (this.suggestIdx + 1) % this.suggestion.length;
		},
		decSuggestIndex: function() {
			const suggestionLength = this.suggestion.length;
			this.suggestIdx = (this.suggestIdx + suggestionLength - 1) % suggestionLength;
		},
		selectSuggest: function() {
			const value = this.suggestion[this.suggestIdx];
			if (value) {
				this.value = value;
				this.$emit('input', value);
			}
		},
	},
	watch: {
		suggestion: function(newSuggestion, oldSuggestion) {
			let suggestIdx = this.suggestIdx;
			const currentSuggest = oldSuggestion[suggestIdx];
			suggestIdx = newSuggestion.indexOf(currentSuggest);
			if (suggestIdx === -1) {
				suggestIdx = 0;
			}
			this.suggestIdx = suggestIdx;
		},
	},
	template: `
<li
	@mouseenter="hover = true"
	@mouseleave="hover = false"
>
	<template v-if="status === 'display'">
		<span
			class="filter-item-displayed"
			:title="title"
		>{{ value }}</span>
		<span v-show="hover">
			<span
				class="fa fa-pencil"
				title="Edit"
				@click="status='edit'"
			></span>
			<span
				class="fa fa-trash"
				title="delete"
				@click="$emit('delete')"
			></span>
		</span>
	</template>
	<template v-else>
		<span class="filter-input-area">
			<input
				class="filter-input"
				:placeholder="suggest"
			>

			<input
				class="filter-input filter-item-mainInput"
				v-model="value"
				v-focus
				@input="$emit('input', value)"
				@keydown.enter.prevent.stop="submitted"
				@keydown.down.prevent="incSuggestIndex"
				@keydown.up.prevent="decSuggestIndex"
				@keydown.right.exact="selectSuggest"
			>
		</span>
		<span>
			<span
				class="fa fa-check-circle"
				title="Confirm"
				@click="submitted"
			></span>
			<span
				class="fa fa-times-circle"
				title="delete"
				@click="$emit('delete')"
			></span>
		</span>
	</template>
</li>
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
        <tr>
            <td>:onlyIfNoChildren::</td>
            <td>Select this file box only if it has no children (it's a leaf)</td>
        </tr>
        <tr>
            <td>:onlyIfNoParents::</td>
            <td>Select this file box only if it has no parents (it's a root)</td>
        </tr>
    </table>
    <p>It is possible to start the rule with '+' to force the visibility of matching boxes.
    <h4>Some examples</h4>
    <ul>
        <li><code class="example">*.min.js</code> Do not display files which end with ".min.js".</li>
        <li><code class="example">[modules]:andChildren::</code> Do not display files in "modules" group and their children.</li>
        <li><code class="example">[filter-*]*leaf.js:children::*.html</code> Do not display all children which end with ".html" of files ending by ".js" in groups startings with "filter-".</li>
        <li><code class="example">+*.js:onlyIfNoParents::</code> Display all files which end with ".js" and are not required by any one.</li>
    </ul>
</div>
	`
};

const filterDialog = {
	props: {
		open: Boolean,
		filters: Array,
		items: Map,
		filterRules: Function,
	},
	data: function() {
		return {
			displayedFilters: this.updateFilters(true),
			uid: 0,
		};
	},
	methods: {
		addItem: function() {
			this.displayedFilters.push({
				id: 'added-' + this.uid++,
				value: '',
			});
		},
		save: function() {
			this.$emit('save', this.displayedFilters.map(filter => filter.value));
		},
		clear: function() {
			this.filters.splice(0, this.filters.length);
		},
		remove: function(idx) {
			this.displayedFilters.splice(idx, 1);
		},
		updateFilters: function(init) {
			const array = this.filters.map(filter => {
				return {
					id: filter.id,
					value: filter.value,
				};
			});
			if (!init) {
				this.displayedFilters = array;
			}
			return array;
		},
		updateValue: function(idx, value) {
			this.displayedFilters[idx].value = value;
		},
	},
	watch: {
		filters: function() {
			this.updateFilters();
		},
	},
	components: {
		'li-filter': filterItem,
		'FilterHelp': filterHelp,
	},
	template: `
<pop-up
	title="Filter"
	:open="open"
>
	<span slot="content">
		<details class="filter-items" open>
			<summary>Filter patterns</summary>
			<ul class="filter-list">
				<li-filter v-for="(item, idx) of displayedFilters"
					class="filter-item"
					:filter="item.value"
					:filterRules="filterRules"
					:items="items"
					@input="value => updateValue(idx, value)"
					@delete="remove(idx)"
					:key="item.id"
				></li-filter>
				<li
					class="filter-item add-item"
					title="Add a new filter"
					@click="addItem"
				>
					<span>
						<span class="fa fa-plus"></span>
						Add a new filter
					</span>
				</li>
			</ul>
		</details>
		<details class="filter-help">
			<summary>Help to build queries</summary>
			<FilterHelp />
		</details>
	</span>
	<template slot="menu">
        <button @click="clear" title="Remove all filters">Clear</button>
        <button @click="$emit('close')">Cancel</button>
        <button @click="save">Apply</button>
    </template>
</pop-up>
	`
};

Vue.component('search-files', {
	props: {
		items: {
			type: Map,
			required: true,
		},
		value: String,
	},
	data: function () {
		return {
			currentValue: '',
			listId: 'itemsDataList' + (uid++),
		};
	},
	methods: {
		submitted: function () {
			const currentValue = this.currentValue;
			if (currentValue && this.items.get(currentValue)) {
				this.$emit('submitted', currentValue);
			}
		},
		changeValue: function () {
			this.$emit('input', this.currentValue);
		},
	},
	computed: {
		searchItems: function () {
			const currentValue = this.currentValue.toLowerCase();
			let list = Array.from(this.items);
			if (currentValue) {
				list = list.filter(item => item[0].toLowerCase().includes(currentValue));
			}

			return list.slice(0, configuration.maxItemOptionsList);
		},
	},
	watch: {
		value: function () {
			this.currentValue = this.value;
		},
	},
	components: {
		'dialog-filter': filterDialog,
	},
	template: `
<div class="search-files">
	<input
		type="search"
		placeholder="search"
		:list="listId"
		autocomplete="off"
		v-model="currentValue"
		@input="changeValue"
		@key.enter.stop.prevent="submitted"
	>
	<datalist :id="listId">
		<option v-for="[itemId, item] of searchItems"
			:value="item.name"
		>{{ item.name }}</option>
	</datalist>
</div>
	`
});

Vue.component('filter-form', {
	props: {
		items: {
			type: Map,
			required: true,
		},
		filters: {
			type: Array,
			required: true,
		},
		filterRules: {
			type: Function,
			required: true,
		},
		selectedItem: [String, Array],
	},
	data: function() {
		return {
			currentValue: '',
			openFilter: false,
		};
	},
	methods: {
		submitted: function() {
			const currentValue = this.currentValue;
			if (currentValue && this.items.get(currentValue)) {
				this.$emit('selection', currentValue);
			}
		},
		saveFilter: function(value) {
			this.$emit('saveFilter', value);
			this.openFilter = false;
		}
	},
	computed: {
		filterTitle: function() {
			const filtersLength = this.filterLength;
			if (filtersLength) {
				return filtersLength + ' rules are enabled';
			} else {
				return 'Set filter to hide some elements';
			}
		},
	},
	watch: {
		selectedItem: function(selectedItems) {
			let selectedItem;
			if (selectedItems instanceof Array) {
				selectedItem = selectedItems[0];
			} else {
				selectedItem = selectedItems;
			}
			if (selectedItem !== this.currentValue) {
				this.currentValue = '';
			}
		},
		openFilter: function() {
			this.$emit('showHelp', this.openFilter ? 'Workspaces' : '');
		}
	},
	components: {
		'dialog-filter': filterDialog,
	},
	template: `
<div class="filterArea">
	<search-files
		class="filter-files"
		v-model="currentValue"
		:items="items"
		@input="submitted"
		@submitted="submitted"
	/>
	<button
		:class="{active: !!filters.length}"
		:title="filterTitle"
		@click="openFilter=!openFilter"
	>
		<span class="fa fa-filter"></span>
	</button>

	<dialog-filter
		:open="openFilter"
		:filters="filters"
		:items="items"
		:filterRules="filterRules"
		@close="openFilter=false"
		@save="saveFilter"
	></dialog-filter>
</div>
	`
});
