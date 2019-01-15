import passwordDialog from '/vues/components/passwordDialog.js';

const iv = new Int8Array([21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);

/* polyfill */
if (typeof Array.prototype.get !== 'function') {
    Array.prototype.get = function(index) {
        if (index >= this.length) {
            return this[this.length - 1];
        } else
        if (index < 0) {
            return this[0];
        } else {
            return this[index];
        }
    };
}

var tools = {
    sha256: async function(text) {
        const txtBuffer = new TextEncoder('utf-8').encode(text);
        const shaBuffer = await crypto.subtle.digest('SHA-256', txtBuffer);
        const hashHex = tools.bufferToHex(shaBuffer);

        return btoa(hashHex);
    },

    getPassword: async function(forceAsk = false) {
        let password = sessionStorage.getItem('password');

        if (forceAsk || !password) {
            try {
                password = await passwordDialog.show();
            } catch(e) {
                return;
            }
            if (!password) {
                sessionStorage.removeItem('password');
                return;
            }
            password = await tools.sha256(password);
            sessionStorage.setItem('password', password);
        }

        return password;
    },

    bufferToHex: function(buffer) {
        const hexCodes = [];
        const view = new DataView(buffer);
        const byteLength = view.byteLength;
        const padding = '00000000';
        for (let i = 0; i < byteLength; i += 4) {
            // Using getUint32 reduces the number of iterations needed (process 4 bytes each time)
            const value = view.getUint32(i);
            const stringValue = value.toString(16);
            // concatenation and slice for padding
            const paddedValue = (padding + stringValue).slice(-8)
            hexCodes.push(paddedValue);
        }

        return hexCodes.join('');
    },

    hexToBuffer: function(strHex) {
        const charLength = 2;

        if (strHex.length % charLength) {
            console.error('%d is not a multiple of %d', strHex.length, charLength);
            return;
        }
        const bufferLength = strHex.length / charLength;
        const buffer = new ArrayBuffer(bufferLength);
        const view = new DataView(buffer);
        const length32Byte = charLength * 4;

        // read 4 characters at once to speed up process
        strHex.match(new RegExp(`.{${length32Byte}}`, 'g')).forEach((val, index) => view.setUint32(index * 4, parseInt(val, 16)));

        return buffer;
    },

    arrToBuffer: function (array) {
        let method = '';
        let mult = 1;

        if (array instanceof Uint8Array) {
            method = 'setUint8';
            mult = 1;
        } else
        if (array instanceof Int8Array) {
            method = 'setInt8';
            mult = 1;
        } else
        if (array instanceof Uint16Array) {
            method = 'setUint16';
            mult = 2;
        } else
        if (array instanceof Int16Array) {
            method = 'setInt16';
            mult = 2;
        } else
        if (array instanceof Uint32Array) {
            method = 'setUint32';
            mult = 4;
        } else
        if (array instanceof Int32Array) {
            method = 'setInt32';
            mult = 4;
        } else
        {
            throw new Error('Type not supported ' + array.toString());
        }


        const buffer = new ArrayBuffer(array.length * mult);
        const view = new DataView(buffer);
        array.forEach((val, index) => view[method](index * mult, val));

        return buffer;
    },

    stringToBuffer: function(str) {
        const codes = new TextEncoder('utf-8').encode(str);
        // make length related to Uint32 length
        const byteLength = 4 * Math.ceil(codes.length / 4);
        const buff = new ArrayBuffer(byteLength);
        const view = new DataView(buff);
        codes.forEach((value, index) => {
            view.setUint8(index, value);
        });
        return buff;
    },

    bufferToString: function(buffer) {
        const text = new TextDecoder('utf-8').decode(buffer);

        return text.replace(/\u0000+$/, '');;
    },

    deriveKey: async function(saltBuf, passphrase) {
        const keyLenBits = 128;
        const kdfname = 'PBKDF2';
        const aesname = 'AES-CBC';
        // longer iterations can slow down process
        // 100 - probably safe even on a browser running from a raspberry pi using pure js polyfill
        const iterations = 100;
        const hashname = 'SHA-512';
        const extractable = true;
        const arrPassPhrase = new TextEncoder('utf-8').encode(passphrase);

        try {
            // create a PBKDF2 "key" containing the password
            const passphraseKey = await crypto.subtle.importKey('raw', arrPassPhrase, { name: kdfname }, false, ['deriveKey']);

            // Derive a key from the password
            const aesKey = await crypto.subtle.deriveKey(
                {
                    name: kdfname,
                    salt: saltBuf,
                    iterations: iterations,
                    hash: hashname,
                },
                // required to be 128 (or 256) bits
                passphraseKey,
                // Key we want
                {
                    name: aesname,
                    length: keyLenBits,
                },
                extractable,
                // For new key
                ['encrypt', 'decrypt'],
            );

            return aesKey;
        } catch(err) {
            throw new Error('Key derivation failed: ' + err.message);
        }
    },

    aesCipher: async function(data, secret, saltBuf) {
        const key = await tools.deriveKey(saltBuf, secret);
        const ciphered = await crypto.subtle.encrypt(
            {
                name: 'AES-CBC',
                iv: iv,
            },
            key,
            tools.stringToBuffer(data)
        );

        return ciphered;
    },

    aesDecipher: async function (data, secret, saltBuf) {
        const key = await tools.deriveKey(saltBuf, secret);

        const deciphered = await crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: iv
            },
            key,
            data,
        );
        return deciphered;
    }

};

export default tools;
