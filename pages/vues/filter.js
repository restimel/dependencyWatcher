(function() {
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
			return {
				status: this.filter ? 'display' : 'edit',
				hover: false,
				value: this.filter,
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

					if (!last) {
						list = ['['];
					} else
					if (/^\[[^\]]*?$/.test(last)) {
						list = this.filterRules(currentRules, this.itemNames);
						list = list.reduce((list, item) => {
							let type = this.items.get(item).type;
							type = '[' + (type && type.name || 'undefined') + ']';

							if (type.startsWith(last) && !list.includes(type)) {
								list.push(type);
							}
							return list;
						}, []);
					} else
					if (/^(?:\[[^\]]*?\])?[^:]*?$/.test(last)) {
						const group = last.replace(/^(\[[^\]]*?\])?.*$/, '$1');
						const file = last.slice(group.length);
						list = this.filterRules(currentRules + '::' + group, this.itemNames);
						list = list.reduce((list, item) => {
							let suggest = group + item;
							if (item.startsWith(file) && !list.includes(suggest)) {
								list.push(suggest);
							}
							const label = (this.items.get(item) || {}).label;
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
						list = [':children::', ':andChildren::', ':parents::', ':andParents::', ':and::'].reduce((list, sub) => {
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
			submit: function() {
				if (this.value) {
					this.status = 'display';
				}
			},
			incSuggestIndex: function() {
				this.suggestIdx = (this.suggestIdx + 1) % this.suggestion.length;
			},
			decSuggestIndex: function() {
				this.suggestIdx = (this.suggestIdx + this.suggestion.length - 1) % this.suggestion.length;
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
				const currentSuggest = oldSuggestion[this.suggestIdx];
				this.suggestIdx = newSuggestion.indexOf(currentSuggest);
				if (this.suggestIdx === -1) {
					this.suggestIdx = 0;
				}
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
				@keydown.enter.prevent.stop="submit"
				@keydown.down.prevent="incSuggestIndex"
				@keydown.up.prevent="decSuggestIndex"
				@keydown.right.exact="selectSuggest"
			>
		</span>
		<span>
			<span
				class="fa fa-check-circle"
				title="Confirm"
				@click="submit"
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
		},
		template: `
<pop-up
	title="Filter"
	:open="open"
	@close="$emit('close')"
	@save="save"
>
	<ul slot="content" class="filter-list">
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
</pop-up>
		`
	};

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
			selectedItem: String
		},
		data: function() {
			return {
				currentValue: '',
				openFilter: false,
			};
		},
		methods: {
			submit: function() {
				if (this.currentValue && this.items.get(this.currentValue)) {
					this.$emit('selection', this.currentValue);
				}
			},
			saveFilter: function(value) {
				this.$emit('saveFilter', value);
				this.openFilter = false;
			}
		},
		computed: {
			searchItems: function() {
				return Array.from(this.items);
			},
			filterTitle: function() {
				if (this.filters.length) {
					return this.filters.length + ' rules are enabled';
				} else {
					return 'Set filter to hide some elements';
				}
			},
		},
		watch: {
			selectedItem: function(selectedItem) {
				if (selectedItem !== this.currentValue) {
					this.currentValue = '';
				}
			},
			openFilter: function() {
				this.$emit('showHelp', this.openFilter ? 'Filter' : '');
			}
		},
		components: {
			'dialog-filter': filterDialog,
		},
		template: `
<div class="filterArea">
	<input type="search" placeholder="search" list="itemsDataList" autocomplete="off"
		v-model="currentValue"
		@input="submit"
		@key.enter="submit"
	>
	<button
		:class="{active: !!filters.length}"
		:title="filterTitle"
		@click="openFilter=true"
	>
		<span class="fa fa-filter"></span>
	</button>
	<datalist id="itemsDataList">
		<option v-for="[itemName, item] of searchItems"
			:value="item.name"
		>{{ item.name }}</option>
	</datalist>

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
})();