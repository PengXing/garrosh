/**
 * @file handler
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

module.exports = function (app) {
    return function handler(req, res, next) {
        app.emit('controller:request', req, res, next);
    };
};
