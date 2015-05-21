/**
 * @file buildResponse.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var http = require('http');
var mime = require('send').mime;
var _ = require('lodash');
var etag = require('etag');
var sign = require('cookie-signature').sign;
var vary = require('vary');

module.exports = function (app) {

    // refer to https://github.com/strongloop/express/blob/master/lib/response.js
    return function (res) {

        res.get = function (field) {
            return this.getHeader(field);
        };
        res.header = function (field, val) {
            if (arguments.length === 2) {
                if (Array.isArray(val)) {
                    val = val.map(String);
                } else {
                    val = String(val);
                }
                if ('content-type' === field.toLowerCase() && !/;\s*charset\s*=/.test(val)) {
                    var charset = mime.charsets.lookup(val.split(';')[0]);
                    if (charset) {
                        val += '; charset=' + charset.toLowerCase();
                    }
                }
                this.setHeader(field, val);
            } else {
                if (typeof field === 'object' && field !== null) {
                    for (var key in field) {
                        if (field.hasOwnProperty(key)) {
                            this.header(key, field[key]);
                        }
                    }
                } else if (typeof field === 'string') {
                    return this.getHeader(field);
                }

            }
            return this;
        };
        res.set = res.header;

        res.type = function (type) {
            if (type.indexOf('/') === -1) {
                type = mime.lookup(type);
            }
            return this.header('Content-Type', type);
        };
        res.clearCookie = function (name, options) {
            var opts = {expires: new Date(1), path: '/'};
            return this.cookie(name, '', options ? _.mixin(opts, options) : opts);
        };
        res.cookie = function (name, val, options) {
            options = options || {};
            var secret = this.req.secret;
            var signed = options.signed;
            if (signed && !secret) {
                throw new Error('cookieParser("secret") required for signed cookies');
            }
            if ('number' === typeof val) {
                val = val.toString();
            }
            if ('object' === typeof val) {
                val = 'j:' + JSON.stringify(val);
            }
            if (signed) {
                val = 's:' + sign(val, secret);
            }
            if ('maxAge' in options) {
                options.expires = new Date(Date.now() + options.maxAge);
                options.maxAge /= 1000;
            }
            if (null == options.path) {
                options.path = '/';
            }
            var cookie = require('cookie');
            var headerVal = cookie.serialize(name, String(val), options);

            // supports multiple 'res.cookie' calls by getting previous value
            var prev = this.get('Set-Cookie');
            if (prev) {
                if (Array.isArray(prev)) {
                    headerVal = prev.concat(headerVal);
                } else {
                    headerVal = [prev, headerVal];
                }
            }
            this.set('Set-Cookie', headerVal);
            return this;
        };
        res.location = function (url) {
            var req = this.req;

            // "back" is an alias for the referrer
            if ('back' === url) {
                url = req.get('Referrer') || '/';
            }

            // Respond
            this.set('Location', url);
            return this;
        };
        res.vary = function (field) {
            vary(this, field);
            return this;
        };
        res.link = function links(links) {
            var link = this.get('Link') || '';
            if (link) {
                link += ', ';
            }
            var _link = Object.keys(links).map(function (rel) {
                return '<' + links[rel] + '>; rel="' + rel + '"';
            }).join(', ');

            link += _link;

            this.header('Link', link);

            return this;
        };
        res.status = function (code) {
            this.statusCode = code;
            return this;
        };

        res.send = function (body) {
            var req = this.req;
            var head = 'HEAD' === req.method;
            var len;

            // allow status / body
            if (2 === arguments.length) {
                // res.send(body, status) backwards compat
                if ('number' !== typeof body && 'number' === typeof arguments[1]) {
                    this.statusCode = arguments[1];
                } else {
                    this.statusCode = body;
                    body = arguments[1];
                }
            }

            switch (typeof body) {
                // response status
                case 'number':
                    this.get('Content-Type') || this.type('txt');
                    this.statusCode = body;
                    body = http.STATUS_CODES[body];
                    break;
                // string defaulting to html
                case 'string':
                    if (!this.get('Content-Type')) {
                        this.type('html');
                    }
                    break;
                case 'boolean':
                case 'object':
                    if (null == body) {
                        body = '';
                    } else if (Buffer.isBuffer(body)) {
                        this.get('Content-Type') || this.type('bin');
                    } else {
                        return this.json(body);
                    }
                    break;
            }

            // populate Content-Length
            if (undefined !== body && !this.get('Content-Length')) {
                this.header('Content-Length', len = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body));
            }

            // ETag support
            // TODO: W/ support
            if (app.config.server.etag && len && ('GET' === req.method || 'HEAD' === req.method)) {
                if (!this.get('ETag')) {
                    this.header('ETag', etag(body));
                }
            }

            // freshness
            if (req.fresh) {
                this.statusCode = 304;
            }

            // strip irrelevant headers
            if (204 === this.statusCode || 304 === this.statusCode) {
                this.removeHeader('Content-Type');
                this.removeHeader('Content-Length');
                this.removeHeader('Transfer-Encoding');
                body = '';
            }

            // respond
            this.end(head ? null : body);
            return this;
        };
        res.json = function (obj) {
            // allow status / body
            if (2 === arguments.length) {
                // res.json(body, status) backwards compat
                this.statusCode = obj;
                obj = arguments[1];
            }

            var body = JSON.stringify(obj);

            // content-type
            this.get('Content-Type') || this.header('Content-Type', 'application/json');

            return this.send(body);
        };
        res.jsonp = function (obj) {
            // allow status / body
            if (2 === arguments.length) {
                // res.json(body, status) backwards compat
                this.statusCode = obj;
                obj = arguments[1];
            }

            // settings
            var body = JSON.stringify(obj).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

            var callbackName = app.config.server.jsonpCallback;
            var callback = this.req.query[callbackName];

            // content-type
            this.get('Content-Type') || this.header('Content-Type', 'application/json');

            // fixup callback
            if (Array.isArray(callback)) {
                callback = callback[0];
            }

            // jsonp
            if (callback && 'string' === typeof callback) {
                this.header('Content-Type', 'text/javascript');
                var cb = callback.replace(/[^\[\]\w$.]/g, '');
                body = 'typeof ' + cb + ' === \'function\' && ' + cb + '(' + body + ');';
            }

            return this.send(body);
        };
        res.sendfile = function (path, options, fn) {
            options = options || {};
            var self = this;
            var req = self.req;
            var next = this.req.next;
            var done;

            if (!options.root) {
                options.root = app.config.global.staticDir;
            }

            // support function as second arg
            if ('function' === typeof options) {
                fn = options;
                options = {};
            }

            // socket errors
            req.socket.on('error', error);

            // errors
            function error(err) {
                if (done) {
                    return;
                }
                done = true;
                // clean up
                cleanup();
                if (!self.headersSent) {
                    self.removeHeader('Content-Disposition');
                }

                // callback available
                if (fn) {
                    return fn(err);
                }

                // list in limbo if there's no callback
                if (self.headersSent) {
                    return;
                }

                // delegate
                next(err);
            }

            // streaming
            function stream(stream) {
                if (done) {
                    return;
                }
                cleanup();
                if (fn) {
                    stream.on('end', fn);
                }
            }

            // cleanup
            function cleanup() {
                req.socket.removeListener('error', error);
            }

            // Back-compat
            options.maxage = options.maxage || options.maxAge || 0;

            var send = require('send');
            // transfer
            var file = send(req, path, options);
            file.on('error', error);
            file.on('directory', next);
            file.on('stream', stream);
            file.pipe(this);
            this.on('finish', cleanup);
        };
        res.redirect = function (url) {
            var status = 302;

            // allow status / url
            if (2 === arguments.length) {
                if ('number' === typeof url) {
                    status = url;
                    url = arguments[1];
                } else {
                    status = arguments[1];
                }
            }

            // Set location header
            this.location(url);

            // Respond
            this.statusCode = status;
            this.end();
        };
        res.forward = function (url) {
            // TODO
        };
        res.render = function (name, options, fn) {
            options = options || {};
            var me = this;
            var req = me.req;

            if ('function' === typeof options) {
                fn = options;
                options = {};
            }

            options.locals = me.locals;
            if (!fn) {
                fn = function (err, str) {
                    if (err) {
                        app.emit('controller:500', err, req, me, me.next);
                    } else {
                        me.send(str);
                    }
                };
            }

            // 调用view来渲染
            app.viewer.render(name, options, fn);
        };

    };

};
