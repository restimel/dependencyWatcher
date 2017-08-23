(function() {
    'use strict';

    var tools = {
        sha256: async function(text) {
            const txtBuffer = new TextEncoder('utf-8').encode(text);
            const shaBuffer = await crypto.subtle.digest('SHA-256', txtBuffer);
            const hashHex = Array.from(new Uint8Array(shaBuffer)).map(b => {
                let h = b.toString(16);
                while (h.length < 2) {
                    h = '0' + h;
                }
                return h;
            }).join('');

            return btoa(hashHex);
        },
        cipherAES: function(text, key) {
            // The initialization vector (must be 16 bytes)
            let iv = [ 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 ];

            // Convert text to bytes (text must be a multiple of 16 bytes)
            // TODO check if it is ok
            let textBytes = aesjs.utils.utf8.toBytes(text);

            let aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
            let encryptedBytes = aesCbc.encrypt(textBytes);
            let encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);

            return encryptedBytes;
        },
        decipherAES: function(text, key) {
            // The initialization vector (must be 16 bytes)
            let iv = [ 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36 ];

            var encryptedBytes = aesjs.utils.hex.toBytes(text);

            let aesCbc = new aesjs.ModeOfOperation.cbc(key, iv)
            let decryptedBytes = aesCbc.decrypt(encryptedBytes);
            let decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

            return decryptedText;
        },
        getPassword: async function(forceAsk = false) {
            let password = sessionStorage.getItem('password');

            if (forceAsk || !password) {
                password = prompt('This ressource is protected by password:');
                if (!password) {
                    sessionStorage.removeItem('password');
                    return;
                }
                password = await tools.sha256(password);
                sessionStorage.setItem('password', password);
            }

            return password;
        }
    };

    self.tools = tools;
})();
