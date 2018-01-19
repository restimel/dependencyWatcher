(function() {
    const extension = {
        'js': 'javascript',
        'txt': 'text'
    };

    Vue.component('code-page', {
        props: {
            items: {
                type: Map,
                required: true,
            },
            selectedItem: String
        },
        data: function() {
            return {
                editor: null,
                session: null,
                text: '',
            };
        },
        computed: {
            item: function() {
                return this.items.get(this.selectedItem) || {};
            },
            language: function() {
                const item = this.item;
                let language = item && item.type && item.type.language;
                if (!language) {
                    language = item.name && item.name.split('.') || [];
                    language = language[language.length - 1] || '';
                }
                return language;
            },
            mode: function() {
                const language = this.language;
                let mode = extension[language];
                if (!mode) {
                    mode = language;
                }
                return mode;
            },
            readOnly: function() {
                return !this.item.canWriteFile;
            }
        },
        methods: {
            save: function() {
                console.log('todo SAVE');
                notification.set('Save is not implemented yet :(', 'warn');
            },
            initialize: function() {
                this.session.setMode('ace/mode/' + this.mode);
                this.editor.setOptions({
                    readOnly: this.readOnly
                });
                this.text = '';
                this.session.setValue('');
                this.getText();
            },
            getText: async function() {
                let password, salt, challenge;
                const item = this.item;

                this.$emit('status', 'loading text');
                if (!item.canReadFile) {
                    this.$emit('status', 'Permission denied to read this file');
                    return;
                } else if (item.canReadFile === 'password') {
                    password = await tools.getPassword();
                    const response = await fetch('getSalt');
                    salt = await response.text();
                    challenge = await tools.sha256(salt + password);
                }

                let getCode = `/getCode?item=${encodeURIComponent(item.name)}`;

                if (salt) {
                    getCode += `&salt=${encodeURIComponent(salt)}&challenge=${encodeURIComponent(challenge)}`;
                }

                let responseCode = await fetch(getCode);
                let code = await responseCode.text();
                if (!responseCode.ok) {
                    sessionStorage.removeItem('password');
                    self.notification('File is not readable', code, 'error');
                    this.$emit('status', 'File is not readable');
                    return;
                }

                if (item.canReadFile === 'password') {
                    try {
                        code = tools.decipherAES(code, password);
                    } catch (e) {
                        self.notification('Cannot decipher the data', e.message, 'warn');
                        this.$emit('status', 'Cannot decipher the data');
                        return;
                    }
                }

                this.text = code;
                this.session.setValue(code);
                this.$emit('status', '');
            }
        },
        watch: {
            selectedItem: function() {
                this.initialize();
            }
        },
        mounted: function() {
            this.editor = ace.edit('codeFile');
            this.session = this.editor.session;
            this.editor.setTheme('ace/theme/monokai');
            this.initialize();
        },
        template: `
    <div class="codeArea">
        <button class="close-code"
            @click="$emit('navigate', 'chart')"
        >
            &times;
        </button>
        <button v-if="!readOnly"
            class="save-code"
            @click="save"
        >
            Save
        </button>
        <div id="codeFile" class="codeFile"></div>
    </div>
        `
    });
})();