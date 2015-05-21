/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  Runner
 */

var connect = require('connect');
var path = require('path');

module.exports = function (app) {

    function Server() {

        /**
         * server相关参数
         */
        this._config = app.config.server;

        /**
         * Server
         */
        this.server;

        /**
         * 保存初始的middleware
         *
         * @type {Array}
         * @private
         */
        this._originalMiddlewares = [];

        this._defaultMiddlewares = [
            'internal.init',
            'connect.cookieParser',
            'connect.bodyParser',
            'internal.session',
            'internal.timeout',
            'internal.queryParser'
        ];

        this.middlewares = [];
    }

    /**
     *
     */
    Server.prototype.initialize = function () {
        app.logger.dProfile('component:Server:initialize');

        this._loadMiddlewares();

        app.logger.dProfile('component:Server:initialize');
        app.logger.info('Component Server initialize DONE');
    };

    /**
     * run
     * @param {number} port port
     * @return {Server}
     */
    Server.prototype.run = function (port) {
        app.emit('runner:beforeRun', this);

        port = port || this._config.port;

        // 引用一些基础的控件
        var _app = connect();

        _app.use(require('./middlewares/domain')(app));

        // 加载用户配置的和默认的中间件
        this.middlewares.forEach(function (middleware) {
            _app.use(middleware.fn);
            app.logger.debug('Load middleware ' + middleware.name + ' finished');
        });

        _app.use(require('./middlewares/handler')(app));
        // errorHandler必须放在最后来执行，要不然到这里的时候不会执行
        _app.use(require('./middlewares/errorHandler')(app));
        // expose server
        this.server = _app.listen(port);

        app.emit('runner:afterRun', this);

        app.logger.info('Server has started!');
        return this;
    };

    /**
     * close server
     */
    Server.prototype.close = function () {
        this.server.close();
    };

    /**
     * 设置middleware
     * @param {string=} name name
     * @param {Function} middleware middleware function
     *
     * @return {Server}
     */
    Server.prototype.middleware = function (name, middleware) {

        if (typeof name === 'function') {
            middleware = name;
            name = 'anonymous';
        }

        // 添加到middlewares队列中
        this.middlewares.push({
            name: name,
            fn: middleware.call(undefined, app)
        });

        app.logger.debug('Add middleware ' + name + ' SUCCESS');

        return this;
    };

    /**
     * load middlewares
     * @private
     */
    Server.prototype._loadMiddlewares = function () {
        this._originalMiddlewares = this._originalMiddlewares.concat(this._defaultMiddlewares);

        // 加载用户配置的middleware
        this._lookupMiddlewares();

        // 对middleware做处理，全部转化为functions
        var me = this;
        this._originalMiddlewares.forEach(function (middleware) {

            var fn;
            switch (typeof middleware) {
                case 'string':
                    var mObj = me._loadMiddlewareByName(middleware);
                    if (mObj) {
                        me.middlewares.push(mObj);
                    }
                    break;
                case 'function':
                    // 将函数添加到middleware中
                    fn = middleware.call(undefined, app);
                    me.middlewares.push({
                        name: fn.name || 'anonymous',
                        fn: fn
                    });
                    break;
                case 'object':
                    var name;
                    if (middleware.fn) {
                        fn = middleware.fn;
                        var args = middleware.args || [];
                        args.push(app);
                        fn = fn.apply(undefined, args);
                        name = middleware.name || fn.name || 'anonymous';
                    } else if (middleware.name) {
                        mObj = me._loadMiddlewareByName(middleware.name);
                        if (!mObj) {
                            return;
                        }

                        fn = mObj.fn;
                        name = mObj.name;
                    }

                    me.middlewares.push({
                        name: name,
                        fn: fn
                    });
                    break;
                default:
                    app.logger.warn('Illegal middleware: ' + middleware);
            }
        });

    };

    /**
     * 根据名称加载middleware
     * @param {string} name name
     * @return {Object}
     * @private
     */
    Server.prototype._loadMiddlewareByName = function (name) {
        name = name.split('.');

        var legal = true;
        var fn;
        if (name.length === 1) {
            // 自定义的middleware
            var middlewarePath = path.join(app.config.global.middlewareDir, name[0]);
            fn = require(middlewarePath);
        } else if (name.length === 2) {
            if (name[0] === 'connect') {
                fn = connect[name[1]];
            } else if (name[0] === 'internal') {
                fn = require('./middlewares/' + name[1]);
            } else {
                legal = false;
            }
        } else {
            legal = false;
        }

        var middleware = {};
        if (!legal) {
            app.logger.warn('Loading middleware failed, name is ' + name.join('.'));
        } else {
            if (typeof fn !== 'function') {
                app.logger.warn('Middleware' + name + ' should by a function');
            } else {
                // 如果是connect的middleware，则不需要注入app参数
                if (name[0] === 'connect') {
                    fn = fn.call(undefined);
                } else {
                    fn = fn.call(undefined, app);
                }

                middleware.name = name.join('.');
                middleware.fn = fn;

                return middleware;
            }

        }

    };

    /**
     * 根据middleware的路径查找middleware
     * @private
     */
    Server.prototype._lookupMiddlewares = function () {
        var middlewares = app.config.middlewares;
        if (middlewares) {
            middlewares = middlewares.middlewares;
        } else {
            return;
        }
        if (middlewares instanceof Array) {
            this._originalMiddlewares = this._originalMiddlewares.concat(middlewares);
        } else if (typeof middlewares === 'object') {
            app.logger.warn('Load user-defined middlewares failed, \'app.config.middlewares\' should be Array');
        }

    };

    return new Server();
};
