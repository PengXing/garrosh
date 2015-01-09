/**
 * @file timeout.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var onHeaders = require('on-headers');

module.exports = function (app) {

    return function timeout(req, res, next) {
        // 默认5000ms
        var time = app.config.server.timeout || 5000;

        var id = setTimeout(function () {
            req.emit('timeout', time);
            // 通知app，有请求超时
            app.emit('request:timeout', req, res);
        }, time);

        req.on('timeout', function () {
            // 超时直接关闭连接
            req.socket.destroy();
        });
        // 超时直接关闭连接
        var destroy = req.socket.destroy;
        req.socket.destroy = function () {
            clearTimeout(id);
            destroy.call(this);
        };

        // 当有header的写入时，我们认为已经准备开始返回，停止timeout
        onHeaders(res, function () {
            clearTimeout(id);
        });

        next();
    };

};
