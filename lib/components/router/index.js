/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var events = require('events');
var util = require('util');

var _ = require('lodash');

var Route = require('./route');

var methods = ['get', 'head', 'post', 'put', 'delete', 'trace', 'options', 'connect', 'patch'];

/**
 * get router object
 * @param {Application} app Application Instance
 * @return {*}
 */
module.exports = function (app) {

    function Router() {
        events.EventEmitter.call(this);

        /**
         * 保存各种method的route
         *
         * @type {Object}
         */
        this.routes = {};

        this._defaultRoutes = {
            '/:controller/:action/:id(\\d+)': {
                controller: '{controller}',
                action: '{action}'
            },
            '/:controller/:action': {
                controller: '{controller}',
                action: '{action}'
            },
            '/:controller': {
                controller: '{controller}'
            }
        };

    }

    util.inherits(Router, events.EventEmitter);

    Router.prototype.bind = function (path, target, method, options) {
        if (arguments.length < 2) {
            app.logger.warn('Router bind error', arguments);
            return false;
        }
        var args = app.util.detectMethod(path);
        path = args.path;
        method = method || args.method;
        options = options || {};


        if (typeof target === 'string' && /^(https?:|\/)/.test(target)) {
            // 如果target是字符串，并且是http:开头或者/开头，则认为是跳转
            this._bindRedirect(path, target, method, options);
        } else if (typeof target === 'function') {
            // 如果target是函数，则直接把当前fn添加到该route中
            this._bindFunction(path, target, method, options);
        } else if (target !== null && typeof target === 'object') {
            options = _.merge(options, target);
            this._bind(path, method, options);
        } else {
            app.logger.warn('Unknown type: ' + args.original + ' ' + method);
        }

        return this;
    };

    Router.prototype.initialize = function () {
        app.logger.dProfile('component:Router:initialize');

        var me = this;
        methods.forEach(function (method) {
            me.routes[method] = [];
        });

        // 绑定默认的route
        Object.keys(me._defaultRoutes).forEach(function (key) {
            me.all(key, me._defaultRoutes[key]);
        });

        // 绑定config中的routes
        // config中的routes应该从前往后
        var config = app.config.routes;
        var keys = Object.keys(config);
        var key;
        for (var i = keys.length - 1; i >= 0; i--) {
            key = keys[i];
            me.bind(key, config[key]);
        }

        app.logger.info('Component Router initialize DONE');
        app.logger.dProfile('component:Router:initialize');
    };

    Router.prototype.all = function (path, target, options) {
        var me = this;

        methods.forEach(function (method) {
            me.bind(path, target, method, options);
        });
    };

    Router.prototype.get = function (path, target, options) {
        this.bind(path, target, 'get', options);
    };

    Router.prototype.post = function (path, target, options) {
        this.bind(path, target, 'post', options);
    };

    Router.prototype.put = function (path, target, options) {
        this.bind(path, target, 'put', options);
    };

    Router.prototype.del = function (path, target, options) {
        this.bind(path, target, 'delete', options);
    };

    /**
     * 添加redirect
     * @param {string} path path
     * @param {string} target target
     * @param {string} method method
     * @param {Object} options options
     * @private
     */
    Router.prototype._bindRedirect = function (path, target, method, options) {
        options.redirect = target;

        this._bind(path, method, options);
    };


    /**
     * 添加middleware
     *
     * @param {string} path path
     * @param {string} target target
     * @param {string} method method
     * @param {Object} options options
     * @private
     */
    Router.prototype._bindFunction = function (path, target, method, options) {
        options = options || {};
        options.middlewares = options.middlewares || [];

        options.middlewares.push(target);

        this._bind(path, method, options);
    };


    Router.prototype._bind = function (path, method, options) {
        var me = this;

        if (method === 'all') {
            methods.forEach(function (method) {
                me._bind(path, method, options);
            });
            return;
        }

        if (!me._validate(options)) {
            app.logger.warn('Wrong options', path, options);
            return me;
        }

        var fn = me._processPath(path);
        var routes = me.routes[method];
        var route = routes[fn.name] || new Route();

        route.fn = fn;
        route.name = fn._name;
        route.method = method;
        route.options = options;
        route.isRegExp = fn.isRegExp || false;
        route.regexp = fn.regexp;

        if (!routes[fn.name]) {
            routes.push(route);
        }

        return me;
    };

    /**
     * 校验options参数是否正确
     * @param {Object} options options
     * @return {boolean}
     * @private
     */
    Router.prototype._validate = function (options) {
        // 如果是静态文件类型的时候，需要有type和dir字段
        if (options.type === 'static' && !options.dir && !app.config.global.staticDir) {
            return false;
        }

        return true;
    };

    /**
     * 处理path为function
     *
     * @param {string} path path
     * @return {Function}
     * @private
     */
    Router.prototype._processPath = function (path) {

        var fn;
        // 匹配当前path是否为正则表达式
        var regexpRoute = /^r\|(.*)\|(.*)$/;

        var params = [];

        var matches = path.match(regexpRoute);
        if (matches) {
            // path为正则表达式
            path = new RegExp(matches[1]);
            params = matches[2].split(',');

            fn = (function (params) {
                return function (req, resp) {
                    var matches = path.exec(req.pathname);
                    if (!matches) {
                        return false;
                    }
                    req.params = req.params || {};

                    params.forEach(function (param, index) {
                        req.params[param] = matches[index + 1];
                    });
                    return true;
                };
            })(params);
            fn.isRegExp = true;
        } else {
            // 统一用path-to-regexp编译一下
            var pathToRegExp = require('path-to-regexp');
            path = pathToRegExp(path, params);

            fn = (function (params) {
                return function (req, resp) {
                    var matches = path.exec(req.pathname);
                    if (!matches) {
                        return false;
                    }
                    req.params = req.params || {};

                    params.forEach(function (param, index) {
                        req.params[param.name] = matches[index + 1];
                    });
                    return true;
                };
            })(params);
        }

        // 用正则作为当前fn的name
        fn._name = path.toString();
        fn.regexp = path;

        return fn;
    };


    /**
     * 根据req匹配route
     *
     * @param {http.ClientRequest} req request
     * @param {http.ServerResponse} resp response
     * @return {*}
     */
    Router.prototype.match = function (req, resp) {
        var me = this;

        var method = req.method.toLowerCase();
        var routes = this.routes[method];

        // 从最新的route开始往前匹配
        var route;
        for (var i = routes.length - 1; i >= 0; i--) {
            route = routes[i];
            if (route.match(req, resp)) {
                // 匹配成功
                route = _.cloneDeep(route);
                return me._wrapRoute(route, req);
            }
        }

        return false;
    };


    /**
     * 把route处理一下
     * @param {Route} route route
     * @param {http.ClientRequest} req request
     * @return {Route}
     * @private
     */
    Router.prototype._wrapRoute = function (route, req) {

        var params = req.params;
        var keys = Object.keys(params);
        var value;
        Object.keys(route.options).forEach(function (key) {
            value = route.options[key];

            if (typeof value === 'string') {
                keys.forEach(function (k) {
                    value = value.replace('{' + k + '}', params[k]);
                });
                route.options[key] = value;
            }

        });

        app.logger.debug(JSON.stringify(route));

        return route;
    };

    return new Router();
};
