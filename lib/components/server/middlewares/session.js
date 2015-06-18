/**
 * @file session.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 * session
 */

var connect = require('connect');

module.exports = function (app) {
    // 如果没启用的话，则不进入session
    if (!app.config.session.enable) {
        return function (req, res, next) {
            next();
        };
    }

    return connect.session(app.session.config);

};
