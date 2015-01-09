/**
 * @file bodyBuffer.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var qs = require('qs');

module.exports = function (app) {
    return function bodyBuffer(req, res, next) {

        if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') {
            req.bodyBuffer = null;
            req.formData = {};

            return next();
        }
        var bodyBuffer = [];

        req.on('data', function (chunk) {
            bodyBuffer.push(chunk);
        });

        req.on('end', function () {
            if (bodyBuffer.length > 0) {
                // 将body绑定在req上
                req.bodyBuffer = Buffer.concat(bodyBuffer);
                var formData = qs.parse(req.bodyBuffer.toString());

                // 将post的参数放在req的formData上面
                req.body = formData;
            }
            next();
        });
    };
};
