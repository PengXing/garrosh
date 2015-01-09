/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  程序的入口
 */

var Application = require('./app');

module.exports = function () {
    return new Application();
};

// 暴露Application
module.exports.Application = Application;

// 暴露基础controller
module.exports.Controller = require('./components/controller/controller');
