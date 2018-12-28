(function() {
    const extension = {
        'js': 'javascript',
        'ts': 'typescript',
        'txt': 'text',
        'py': 'python',
        'tex': 'latex',
        'htm': 'html',
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
            },
            onKeyDown: function() {
                return function(evt) {
                    const key = evt.key.toLowerCase();
                    const ctrl = evt.ctrlKey;

                    function stop() {
                        evt.stopPropagation();
                        evt.preventDefault();
                    }

                    if (ctrl && key === 's') {
                        stop();
                        this.save();
                        return;
                    }

                    if (key === 'escape') {
                        stop();
                        this.$emit('navigate', 'chart');
                        return;
                    }
                }.bind(this);
            },
        },
        methods: {
            initialize: function() {
                this.session.setMode('ace/mode/' + this.mode);
                this.editor.setOptions({
                    readOnly: this.readOnly
                });
                this.text = '';
                this.session.setValue('');
                this.getText();
            },
            textHasChanged: function() {
                return this.text !== this.session.getValue();
            },
            getSaltChallenge: async function() {
                const password = await tools.getPassword();
                const response = await fetch('getSalt');
                const salt = await response.text();
                const challenge = await tools.sha256(salt + password);

                return [salt, challenge];
            },
            save: async function () {
                let salt, challenge;

                if (this.readOnly) {
                    this.$emit('status', 'Permission denied to write this file');
                    return;
                }
                if (!this.textHasChanged()) {
                    self.notification.set('There are nothing to save', 'No modification detected', 'info');
                    return;
                }
                const currentText = this.session.getValue();
                const item = this.item;

                if (item.canReadFile === 'password') {
                    [salt, challenge] = await this.getSaltChallenge();
                }

                let writeCode = `/writeCode?item=${encodeURIComponent(item.name)}`;

                if (salt) {
                    writeCode += `&salt=${encodeURIComponent(salt)}&challenge=${encodeURIComponent(challenge)}`;
                }

                const responseCode = await fetch(writeCode, {
                    method: 'POST',
                    body: currentText,
                });
                const code = await responseCode.text();
                if (!responseCode.ok) {
                    sessionStorage.removeItem('password');
                    self.notification.set('File is not writable', code, 'error');
                    this.$emit('status', 'File is not writable');
                    return;
                }
                this.text = currentText;
                self.notification.set('File saved', '', 'success');
                this.$emit('status', '');
            },
            getText: async function() {
                let salt, challenge;
                const item = this.item;

                this.$emit('status', 'loading text');
                if (!item.canReadFile) {
                    this.$emit('status', 'Permission denied to read this file');
                    return;
                } else if (item.canReadFile === 'password') {
                    [salt, challenge] = await this.getSaltChallenge();
                }

                let getCode = `/getCode?item=${encodeURIComponent(item.name)}`;

                if (salt) {
                    getCode += `&salt=${encodeURIComponent(salt)}&challenge=${encodeURIComponent(challenge)}`;
                }

                const responseCode = await fetch(getCode);
                const code = await responseCode.text();
                if (!responseCode.ok) {
                    sessionStorage.removeItem('password');
                    self.notification.set('File is not readable', code, 'error');
                    this.$emit('status', 'File is not readable');
                    return;
                }

                // if (item.canReadFile === 'password') {
                //     try {
                //         code = tools.decipherAES(code, password);
                //     } catch (e) {
                //         self.notification.set('Cannot decipher the data', e.message, 'warn');
                //         this.$emit('status', 'Cannot decipher the data');
                //         return;
                //     }
                // }

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
            document.addEventListener('keydown', this.onKeyDown);
        },
        beforeDestroy: function() {
            document.removeEventListener('keydown', this.onKeyDown);
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