function module_code() {
    'use strict';

    var codeArea = document.getElementById('codeArea');
    var editor = ace.edit('codeFile');
    var session = editor.session;
    var btnSave = document.querySelector('.save-code');

    editor.setTheme('ace/theme/monokai');

    var extension = {
        'js': 'javascript',
        'txt': 'text'
    };

    function showCode() {
        if (codeArea.classList.contains('active')) {
            return;
        }

        document.querySelector('.main-page.active').classList.remove('active');
        codeArea.classList.add('active');
    }

    function displayCode(text, item) {
        var language = '';

        language = item.type && item.type.language;
        if (!language) {
            language = item.name.split('.');
            language = language[language.length-1];
        }

        let mode = extension[language];
        if (!mode) {
            mode = language;
        }

        let readOnly = !item.canWriteFile;

        session.setMode('ace/mode/' + mode);
        editor.setOptions({
            readOnly: readOnly
        });

        if (readOnly) {
            btnSave.classList.remove('active');
        } else {
            btnSave.classList.add('active');
        }

        session.setValue(text);
        showCode();
    }
    self.displayCode = displayCode;

    async function save() {
        let salt, challenge;

        if (!currentMainItem.canWriteFile) {
            return;
        } else if (currentMainItem.canWriteFile === 'password') {
            let password = await tools.getPassword();
            let response = await fetch('getSalt');
            salt = await response.text();
            challenge = await tools.sha256(salt + password);
        }

        let writeCode = `/writeCode?item=${encodeURIComponent(currentMainItem.name)}`;

        if (salt) {
            writeCode += `&salt=${encodeURIComponent(salt)}&challenge=${encodeURIComponent(challenge)}`;
        }

        let result = await fetch(writeCode, {
            method: 'POST',
            body: session.getValue()
        })

        if (result.ok) {
                self.notification('File saved');
        } else {
            let msg = await result.text();
            self.notification('File cannot be saved', msg, 'danger');
        }
    }

    document.querySelector('.close-code').onclick = self.displaySVG;
    btnSave.onclick = save;

}