/**
 * @file queryParser
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var qs = require('qs');

module.exports = function (app) {

    return function queryParser(req, res, next) {

        // refer to express middleware query
        if (!req.url) {
            req.query = ~req.url.indexOf('?') ? qs.parse(req.url) : {};
        }

        next();
    };
};
