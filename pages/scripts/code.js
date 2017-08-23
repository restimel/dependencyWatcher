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

    function save() {
        console.info('todo save', session.getValue());
    }

    document.querySelector('.close-code').onclick = self.displaySVG;
    btnSave.onclick = save;

}