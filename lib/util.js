/**
 * @file util.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

/**
 * generate uuid
 *
 * @return {string}
 */
exports.guid = function () {
    // refer to http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * generate pvid
 *
 * @param {Date} date the date
 * @return {number}
 */
exports.pvid = function (date) {
    return Math.abs(((date.getSeconds() * 100000 + date.getMilliseconds() / 10) & 0x7FFFFFFF) | 0x80000000);
};

/**
 * 根据函数获取函数的参数名
 *
 * @param {Function|boolean} fn the fn
 * @return {Array}
 */
exports.getFuncParams = function (fn) {
    if (typeof fn !== 'function') {
        return false;
    }
    return fn.toString()
        .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg, '')
        .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
        .split(/,/);
};

/**
 * 根据path检测method
 * @param {string} path route path
 *
 * @return {Object}
 */
exports.detectMethod = function (path) {
    var methods = ['get', 'head', 'post', 'put', 'delete', 'trace', 'options', 'connect', 'patch'];

    var method;
    var originalPath = path;

    var arr = path.trim().split(' ');
    if (arr.length === 1) {
        method = 'all';
    } else {
        method = arr[0].toLowerCase();
        if (~methods.indexOf(method)) {
            arr[0] = '';
        } else {
            method = 'all';
        }
        arr[0] = '';
        path = arr.join(' ').trim();
    }

    return {
        method: method,
        path: path,
        original: originalPath
    };

};

/**
 * Return ETag for `body`.
 * @param {string|Buffer} body body text
 *
 * @return {string}
 */
exports.etag = function (body) {
    var crc32 = require('buffer-crc32');
    return '"' + crc32.signed(body) + '"';
};

/**
 * 根据当前object获取class name
 * @param {Object} clazz class
 *
 * @return {string}
 */
exports.getClassName = function (clazz) {

    if (clazz.constructor) {
        return clazz.constructor.name;
    }

    return null;
};

/**
 * Check if `path` looks absolute.
 *
 * @param {string} path path
 * @return {boolean}
 * @api private
 */
exports.isAbsolute = function (path) {
    if ('/' === path[0]) {
        return true;
    }
    if (':' === path[1] && '\\' === path[2]) {
        return true;
    }
    if ('\\\\' === path.substring(0, 2)) {
        return true; // Microsoft Azure absolute path
    }
};


/**
 * 根据path和root计算绝对路径
 * @param {string} pathname pathname
 * @param {string} root root
 *
 * @return {string}
 */
exports.resolve = function (pathname, root) {
    var path = require('path');
    if (exports.isAbsolute(pathname)) {
        return pathname;
    }

    var args = Array.prototype.slice.call(arguments, 0);
    args.reverse();

    return path.resolve.apply(undefined, args);
};

/**
 * 根据当前method，返回对应的默认的action的名称
 *
 * @param {string} method the http method name
 * @return {string}
 */
exports.detectActionName = function (method) {
    var maps = {
        'get': 'find',
        'post': 'create',
        'put': 'update',
        'delete': 'destroy'
    };

    return maps[method.toLowerCase()];
};

/**
 * encode HTML
 * @param {string} html the html to be encoded
 * @return {string}
 */
exports.encodeHTML = function (html) {
    return String(html)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
