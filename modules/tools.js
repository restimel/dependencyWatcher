var crypto = require('crypto');

if (typeof Array.prototype.find === 'undefined') {
	Array.prototype.find = function(f, ctx) {
		var value;

		this.some(function(v) {
			if (f.apply(ctx, arguments)) {
				value = v;
				return true;
			}
		});

		return value;
	};
}

/* Allow to extend an object (obj1) from another object (obj2)
 * It creates copy of inner reference, so any changes in obj1 does not impact obj2
 * The reference obj1 is modified by this function */
exports.extend = function extend(obj1, obj2) {
	var key;

	for (key in obj2) {
		if (!obj2.hasOwnProperty(key)) {
			continue;
		}

		if (typeof obj1[key] === 'object' && !(obj1[key] instanceof RegExp)) {
			extend(obj1[key], obj2[key]);
		} else {
			obj1[key] = obj2[key];
		}
	}

	return obj1;
};

/**
 * Create a copy of an object and copy of its inner properties
 */
exports.clone = function clone(obj) {
	var objClone = {};
	var key, value;

	for (key in obj) {
		if (!obj.hasOwnProperty(key)) {
			continue;
		}
		value = obj[key];

		if (typeof value === 'object') {
			if (value instanceof Array) {
				objClone[key] = value.map(function(v) {
					if (typeof v === 'object') {
						return clone(v);
					} else {
						return v;
					}
				});
			} else if (value instanceof RegExp) {
				objClone[key] = new RegExp(value.source, value.flags);
			} else {
				objClone[key] = clone(value);
			}
		} else {
			objClone[key] = value;
		}
	}

	return objClone;
};

/* Allow to loop on object keys
 */
exports.each = function(obj, callback, ctx) {
	var x;

	ctx = ctx || obj;

	for(x in obj) {
		if (obj.hasOwnProperty(x)) {
			callback.call(ctx, obj[x], x, obj);
		}
	}
};

/* Prepare a string to be regexpify.
 * Special characters are escaped
 * All wildcards '*' are changed into '.*' */
exports.toRegExp = function(str) {
	return str.replace(/\\(?![nrs])/g, '\\\\')
			  .replace(/([-.()[\]{}$^|+])/g, '\\$1')
			  .replace(/\*/g, '.*');
};

/* Generate a salt for challenge and cipher message
 */
exports.generateSalt = function(size, encoding) {
	if (!size) {
		size = 256;
	}
	if (!encoding) {
		encoding = 'base64';
	}
	return crypto.randomBytes(size).toString(encoding);
};

/**
 * Encode in sha256
 */
function sha256(text, encoding) {
	if (!encoding) {
		encoding = 'utf8';
	}
	var tmp = crypto.createHash('sha256').update(text, encoding).digest();
	var hex = Array.from(tmp).map(b => {
        var h = b.toString(16);
        while (h.length < 2) {
            h = '0' + h;
        }
        return h;
    }).join('');
	return (new Buffer(hex)).toString('base64');
};
exports.sha256 = sha256;

/* Generate a challenge from a salt
 */
exports.generateChallenge = function(salt, password, encoding) {
	var text = salt + password;

	return sha256(text, encoding);
};

/* Cipher a text
 */
exports.cipher = function(text, key, encoding) {
	var cipher = crypto.createCipher('aes-128-cbc', key);
	var encrypted;

	if (!encoding) {
		encoding = 'utf8';
	}

	encrypted = cipher.update(text, encoding, 'hex');
	encrypted += cipher.final('hex');

	return encrypted;
};

/* Decipher a text
 */
exports.decipher = function(text, key, encoding) {
	var decipher = crypto.createDecipher('aes-128-cbc', key);
	var decrypted;

	if (!encoding) {
		encoding = 'utf8';
	}

	decrypted = decipher.update(text, 'hex', encoding);
	decrypted += decipher.final(encoding);

	return decrypted;
};