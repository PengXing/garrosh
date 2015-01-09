/**
 * @file session.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 * session
 */

var connect = require('connect');

module.exports = function (app) {

    return connect.session(app.session.config);

};
