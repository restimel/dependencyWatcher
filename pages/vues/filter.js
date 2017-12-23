Vue.component('filter-form', {
	props: {
		items: {
			type: Array,
			default: () => ([]),
		},
		selectedItem: String
	},
	data: function() {
		return {
			currentValue: ''
		};
	},
	methods: {
		submit: function() {
			if (this.currentValue && this.items.find(item => item.name === this.currentValue)) {
				this.$emit('selection', this.currentValue);
			}
		}
	},
	watch: {
		selectedItem: function(selectedItem) {
			if (selectedItem !== this.currentValue) {
				this.currentValue = '';
			}
		}
	},
    template: `
<div class="filterArea">
	<input type="search" placeholder="search" list="itemsDataList" autocomplete="off"
		v-model="currentValue"
		@input="submit"
		@key.enter="submit"
	>
	<button><span class="fa fa-filter"></span></button>
	<datalist id="itemsDataList">
		<option v-for="item of items"
			:value="item.name"
		>{{ item.name }}</option>
	</datalist>
</div>
    `
});