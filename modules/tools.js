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
