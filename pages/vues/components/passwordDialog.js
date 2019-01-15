import '/scripts/vueSetup.js';
import '/vues/components/popup.js';

const passwordDialog = new Vue({
    el: '#passwordDialog',
    data: {
        value: '',
        isActive: false,
        resolve: () => {},
        reject: () => {},
    },
    methods: {
        show: function() {
            this.isActive = true;
            this.value = '';
            setTimeout(() => this.$refs.passwordElement.focus(), 10);
            return new Promise((resolve, reject) => (this.resolve = resolve, this.reject = reject));
        },

        getValue: function() {
            return this.value;
        },

        close: function() {
            this.isActive = false;
            this.$emit('close');
            this.reject();
        },
        save: function() {
            this.isActive = false;
            this.$emit('save', this.value);
            this.resolve(this.value);
        },
    },
    template: `
<pop-up
    title="Enter your password"
    :open="isActive"
    @close="close()"
    @save="save()"
>
    <div slot="content">
        <label>
            Password: <input type="password" v-model="value" v-focus ref="passwordElement">
        </label>
    </div>
</pop-up>
    `
});

export default passwordDialog;
