
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
