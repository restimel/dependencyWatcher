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
			};
		},
		computed: {
			suggest: function() {
				let text = this.value;
				
				if (!text) {
					text = 'Enter filter rule here';
				} else {
					const list = ['[', ':children:'].filter(l => l.startsWith(text));
					text = list[0] || '';
				}

				return text;
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
			}
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
				@input="evt => $emit('input', this.value, evt.currentTarget.value)"
				@keydown.enter.prevent.stop="submit"
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
		},
		watch: {
			filters: function() {
				this.updateFilters();
			}
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
			@input="value => displayedFilters[idx].value = value"
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