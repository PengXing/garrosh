/**
 * @file buildRequest.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var accepts = require('accepts');
var typeis = require('type-is');
var fresh = require('fresh');

module.exports = function (app) {

    // refer to https://github.com/strongloop/express/blob/master/lib/request.js
    return function (req) {

        req.__defineGetter__('ips', function () {
            var trustProxy = app.config.server.trustProxy;
            var val = this.header('X-Forwarded-For');
            if (trustProxy && val) {
                return val.split(/ *, */);
            } else {
                return [];
            }
        });

        req.__defineGetter__('ip', function () {
            return this.ips[0] || this.connection.remoteAddress;
        });

        req.__defineGetter__('isAjax', function () {
            var val = this.header('X-Requested-With') || '';
            return 'xmlhttprequest' === val.toLowerCase();
        });

        req.__defineGetter__('fresh', function () {
            var method = this.method;
            var s = this.res.statusCode;

            // GET or HEAD for weak freshness validation only
            if ('GET' !== method && 'HEAD' !== method) {
                return false;
            }

            // 2xx or 304 as per rfc2616 14.26
            if ((s >= 200 && s < 300) || 304 === s) {
                return fresh(this.headers, this.res._headers);
            }

            return false;
        });

        req.param = param;
        req.get = header;
        req.header = header;
        req.accepts = _accepts;
        req.acceptsEncodings = acceptsEncodings;
        req.acceptsCharsets = acceptsCharsets;
        req.acceptsLanguages = acceptsLanguages;
        req.is = is;

    };

    function param(key) {
        var params = this.params || {};
        var query = this.query || {};
        var body = this.body || {};

        // 目前params存放在三个地方，
        // req.params存放url中匹配的参数
        // req.query存放get的参数
        // req.formData存放form的参数
        if (key in params) {
            return params[key];
        }

        if (key in query) {
            return query[key];
        }

        if (key in body) {
            return body[key];
        }
    }

    function header(name) {
        name = name.toLowerCase();
        if (name === 'referer' || name === 'referrer') {
            return this.headers.referrer || this.headers.referer;
        }

        return this.headers[name];
    }

    function _accepts() {
        var accept = accepts(this);
        return accept.types.apply(accept, arguments);
    }

    function acceptsEncodings() {
        var accept = accepts(this);
        return accept.encodings.apply(accept, arguments);
    }

    function acceptsCharsets() {
        var accept = accepts(this);
        return accept.charsets.apply(accept, arguments);
    }

    function acceptsLanguages() {
        var accept = accepts(this);
        return accept.languages.apply(accept, arguments);
    }

    function is(types) {
        if (!Array.isArray(types)) {
            types = [].slice.call(arguments);
        }
        return typeis(this, types);
    }


};
