/**
 * @file consolidate.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var consolidate = require('consolidate');

module.exports = function (app) {

    // 在consolidate上添加etpl
    consolidate.etpl = require('./etpl')(app);


    /**
     * 让ejs支持filter
     *
     * @param {string} name name
     * @param {Function} filter filter
     */
    consolidate.ejs.filter = function (name, filter) {
        var ejs = require('ejs');
        ejs.filters[name] = filter;
    };


    return consolidate;
};
