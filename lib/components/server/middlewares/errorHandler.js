/**
 * @file errorHandler.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

module.exports = function (app) {

    return function errorHandler(err, req, res, next) {
        if (err.status) {
            res.statusCode = err.status;
        }

        if (!res.statusCode || res.statusCode < 400) {
            res.statusCode = 500;
        }

        // catch the exception which caught by Connect.
        app.emit('controller:500', err, req, res, next);

    };

};
