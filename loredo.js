"use strict";

function coalesce (old, additional) {
    if (additional === null || additional === undefined) return old;
    if (old) {
        return (Array.isArray(old)) ? (old.concat(additional)) : ([old].concat(additional));
    } else {
        return (Array.isArray(additional)) ? additional : [additional];
    }
}

function filter (collection, pred) {
    var k = Object.keys(collection);
    var i, r = [];
    var pfunc = pred;
    if (typeof pred === 'string') {
        pfunc = function filterPropTruthy(o) {
            return !!o[pred];
        }
    } else if (typeof pred !== 'function') {
        var kp = Object.keys(pred);
        pfunc = function filterPropMatch(o) {
            for (var j = 0; j < kp.length; j++) {
                if (o[kp[j]] != pred[kp[j]]) return false;
            }
            return true;
        }
    }
    for (i = 0; i < k.length; i++) {
        var v = collection[k[i]];
        if (pfunc(v)) r.push(v);
    }
    return r;
}

function pluck (collection, propName) {
    var r = [];
    var i;
    for (i = 0; i < collection.length; i++) {
        if ( collection[i][propName]!== undefined) r.push(collection[i][propName]);
    }
    return r;
}

function forEach (collection, func) {
    return collection.forEach(func); // should be replaced in main codebase
}

function first (collection) {return collection[0];} // could probably do with replacing in code.

function clone (o) {
    var n = {};
    var i, k = Object.keys(o);
    for (i = 0; i < k.length; i++) {n[k[i]] = o[k[i]];}
    return n;
}

function groupBy (collection, pred) {
    var n = {};
    var i, k = Object.keys(collection);
    var pfunc = pred;
    if (typeof pred === 'string') {
        pfunc = function groupPropSelect(o) {
            return o[pred];
        }
    }
    for (i = 0; i < k.length; i++) {
        var t = collection[k[i]];
        var v = pfunc(t);
        n[v] = coalesce(n[v], t);
    }
    return n;
}

function difference (a,b) {
    var i,n = [];
    for (i = 0; i < a.length; i++) {
        if (b.indexOf(a[i]) < 0) n.push(a[i]);
    }
    return n;
}

function merge(dst, src, join){
    return mergeDESC(dst,src,join||coalesce,[],[]);
}

function isPlainObject(obj) {
  if (typeof obj == 'object' && obj !== null) {
    if (typeof Object.getPrototypeOf == 'function') {
      var proto = Object.getPrototypeOf(obj);
      return proto === Object.prototype || proto === null;
    }
    return Object.prototype.toString.call(obj) == '[object Object]';
  }
  return false;
}

function mergeDESC (dst, src, join, stackA, stackB) {
    var i,k = Object.keys(src);
    for (i = 0; i < k.length; i++) {
        mergeREC(dst, src[k[i]], k[i], join, stackA, stackB);
    }
}

function mergeREC(dst, source, key, join, stackA, stackB) {
    var found,
        isArr,
        result = source,
        value = dst[key];

    isArr = Array.isArray(source);

    if (source && ((isArr) || isPlainObject(source))) {
        // avoid merging previously merged cyclic sources
        var stackLength = stackA.length;
        while (stackLength--) {
            if (found = (stackA[stackLength] == source)) {
                value = stackB[stackLength];
                break;
            }
        }
        if (!found) {
            var isShallow;
            result = join(value, source);
            if ((isShallow = typeof result != 'undefined')) {
                value = result;
            }
            if (!isShallow) {
                value = isArr
                ? (Array.isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
                mergeDESC(value, source, join, stackA, stackB);
            }
        }
    } else {
        result = join(value, source);
        if (typeof result == 'undefined') {
            result = source;
        }
        if (typeof result != 'undefined') {
            value = result;
        }
    }
    dst[key] = value;
}

function remove (array, pred) {
    var i, l = array.length;
    var pfunc = pred;
    if (typeof pred === 'string') {
        pfunc = function removePropTruthy(o) {
            return !!o[pred];
        }
    } else if (typeof pred !== 'function') {
        var kp = Object.keys(pred);
        pfunc = function removePropMatch(o) {
            for (var j = 0; j < kp.length; j++) {
                if (o[kp[j]] != pred[kp[j]]) return false;
            }
            return true;
        }
    }
    for (i = 0; i < l; i++) { // nasty loop to mutate the parameter with js's odd pass-by-ref
        var v = array.pop();
        if (!pfunc(v)) array.unshift(v);
    }

    return array;
}

function find (array, pred) {
    var i;
    var pfunc = pred;
    if (typeof pred === 'string') {
        pfunc = function findPropTruthy(o) {
            return !!o[pred];
        }
    } else if (typeof pred !== 'function') {
        var kp = Object.keys(pred);
        pfunc = function findPropMatch(o) {
            for (var j = 0; j < kp.length; j++) {
                if (o[kp[j]] != pred[kp[j]]) return false;
            }
            return true;
        }
    }
    for (i = 0; i < array.length; i++) {
        var v = array[i];
        if (pfunc(v)) return(v);
    }
    return undefined;
}

function some (array, pred) {
     var pfunc = pred;
    if (typeof pred === 'string') {
        pfunc = function somePropTruthy(o) {
            return !!o[pred];
        }
    } else if (typeof pred !== 'function') {
        var kp = Object.keys(pred);
        pfunc = function somePropMatch(o) {
            for (var j = 0; j < kp.length; j++) {
                if (o[kp[j]] != pred[kp[j]]) return false;
            }
            return true;
        }
    }

    return array.some(pfunc);
}

function indexBy (collection, pred) {
    var n = {};
    var i, k = Object.keys(collection);
    var pfunc = pred;
    if (typeof pred === 'string') {
        pfunc = function groupPropSelect(o) {
            return o[pred];
        }
    }
    for (i = 0; i < k.length; i++) {
        var t = collection[k[i]];
        var v = pfunc(t);
        n[v] = t;
    }
    return n;
}


module.exports = {
    filter : filter,
    pluck : pluck,
    clone : clone,
    groupBy : groupBy,
    difference : difference,
    merge : merge,
    remove : remove,
    find : find,
    some : some,
    indexBy : indexBy
};