(function() {
    const extension = {
        'js': 'javascript',
        'txt': 'text'
    };

    Vue.component('code-page', {
        props: {
            items: {
                type: Array,
                default: () => ([])
            },
            selectedItem: String
        },
        data: function() {
            return {
                editor: null,
                session: null,
                text: '',
                status: '',
            };
        },
        computed: {
            item: function() {
                return this.items.find(item => item.name === this.selectedItem) || {};
            },
            language: function() {
                let language = this.item && this.item.type && this.item.type.language;
                if (!language) {
                    language = this.item.name && this.item.name.split('.') || [];
                    language = language[language.length - 1] || '';
                }
                return language;
            },
            mode: function() {
                let mode = extension[this.language];
                if (!mode) {
                    mode = this.language;
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
            },
            initialize: function() {
                this.session.setMode('ace/mode/' + this.mode);
                this.editor.setOptions({
                    readOnly: this.readOnly
                });
                this.text = '';
                this.session.setValue(this.text);
                this.getText();
            },
            getText: async function() {
                let password, salt, challenge;

                this.status = 'loading text';
                if (!this.item.canReadFile) {
                    this.status = 'Permission denied to read this file';
                    return;
                } else if (this.item.canReadFile === 'password') {
                    password = await tools.getPassword();
                    const response = await fetch('getSalt');
                    salt = await response.text();
                    challenge = await tools.sha256(salt + password);
                }

                let getCode = `/getCode?item=${encodeURIComponent(this.item.name)}`;

                if (salt) {
                    getCode += `&salt=${encodeURIComponent(salt)}&challenge=${encodeURIComponent(challenge)}`;
                }

                let responseCode = await fetch(getCode);
                let code = await responseCode.text();
                if (!responseCode.ok) {
                    sessionStorage.removeItem('password');
                    self.notification('File is not readable', code, 'danger');
                    this.status = 'File is not readable';
                    return;
                }

                if (this.item.canReadFile === 'password') {
                    try {
                        code = tools.decipherAES(code, password);
                    } catch (e) {
                        self.notification('Cannot decipher the data', e.message, 'warn');
                        this.status = 'Cannot decipher the data';
                        return;
                    }
                }

                this.text = code;
                this.session.setValue(this.text);
                this.status = '';
            }
        },
        watch: {
            selectedItem: function() {
                this.initialize();
            }
        },
        mounted: function() {
            console.log('mounted');
            this.editor = ace.edit('codeFile');
            this.session = this.editor.session;
            this.editor.setTheme('ace/theme/monokai');
            this.session.setValue('toto')
            this.initialize();
        },
        template: `
    <div class="codeArea">
        <aside
            :class="{
                codeStatus: true,
                active: !!status
            }"
        >{{ status }}</aside>
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