/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  Viewer
 */


var _ = require('lodash');

var path = require('path');
var fs = require('fs');


module.exports = function (app) {

    var consolidate = require('./consolidate')(app);

    function Viewer() {

        /**
         * @type {String}
         */
        this.templateDir;
        /**
         * @type {Function}
         */
        this.engine;
        /**
         * @type {String}
         */
        this.engineName;
        /**
         * @type {String}
         */
        this.ext;
        /**
         * @type {boolean}
         */
        this.cacheable;

        /**
         * 缓存
         *
         * @type {Object}
         */
        this.cache = {};
        /**
         * 全局性的模板变量
         *
         * @type {Object}
         */
        this.locals = {};

        /**
         * 全局配置
         *
         * @type {Object}
         */
        this.options = {};
    }

    Viewer.prototype.initialize = function () {
        app.logger.dProfile('component:Viewer:initialize');

        this.templateDir = app.config.global.templateDir;
        this.ext = app.config.view.ext;
        this.cacheable = app.config.view.cache;

        // 存在locals中
        this.locals.cache = this.cacheable;
        this.options = app.config.view.options;


        var engine = app.config.view.engine;
        var name;
        if (typeof engine === 'string') {
            // engine name
            name = engine;

            var loaded = true;
            engine = consolidate[name];
            if (!engine) {
                loaded = false;
            } else {
                try {
                    engine.render();
                } catch (err) {
                    if (err.code === 'MODULE_NOT_FOUND') {
                        loaded = false;
                    }
                }
            }

            if (!loaded) {
                app.logger.fatal(''
                    + 'You should add the server-side view engine '
                    + name
                    +  ' you configured to the package.json.'
                );
                throw new Error('No corresponding view engine ' + name + ' found!');
            }
        } else if (typeof engine === 'function') {
            engine = engine.call(this, app, options);
            // this is the engine fn
            name = engine.name;

            if (!name) {
                name = 'anonymous';
            }
        }

        this.engine = engine;
        this.engineName = name;

        // 添加plugins
        this.addFilters(engine);

        app.logger.dProfile('component:Viewer:initialize');
        app.logger.info('Component Viewer initialize DONE');
    };

    Viewer.prototype.render = function (name, options, fn) {
        var opts = {};
        var cache = this.cache;
        var view;

        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        _.merge(opts, this.locals);
        _.merge(opts, this.options);
        _.merge(opts, options.locals);
        _.merge(opts, options);


        var cacheable = this.cacheable;
        cacheable = !!opts.cache ? true : cacheable;

        if (cacheable) {
            view = cache[name];
        }

        if (!view) {
            view = this.generate(name);
            if (!view) {
                // 找不到对应的模板文件
                var err = new Error('Can not find the tpl: ' + name);
                return fn(err);
            }

            if (cacheable) {
                this.cache[name] = view;
            }
        }

        try {
            view(opts, fn);
        } catch (err) {
            fn(err);
        }
    };

    /**
     * 根据模板名找到具体的路径
     *
     * @param {String} name
     * @returns {Function}
     */
    Viewer.prototype.generate = function (name) {
        var ext = path.extname(name);
        if (!ext) {
            name = name + '.' + this.ext;
        }

        var file = name;
        if (!app.util.isAbsolute(name)) {
            file = path.join(this.templateDir, name);
        }

        if (!fs.existsSync(file)) {
            file = path.join(
                path.dirname(name),
                path.basename(name),
                'index.' + this.ext
            );

            if (!fs.existsSync(file)) {
                app.logger.fatal('Can not find the tpl: ' + name);
                return false;
            }
        }

        var me = this;

        return function (opts, fn) {
            me.engine(file, opts, fn);
        };
    };

    /**
     * 为engine添加filter
     * @param {Function} engine
     */
    Viewer.prototype.addFilters = function (engine) {

        if (!engine.filter) {
            app.logger.warn(''
                    + this.engineName
                    + ' doesn\'t support filter function. We will ignore plugins developers defined.'
            );
            return;
        }

        var plugins = app.config.view.plugins || [];

        var pluginDir = app.config.global.pluginDir;

        var me = this;
        var plugin;
        var filepath;
        plugins.forEach(function (name) {
            filepath = path.join(pluginDir, name);
            if (fs.existsSync(filepath + '.js')) {
                plugin = require(filepath);
                plugin = plugin.call(undefined, app);

                // 添加plugin
                engine.filter(name, plugin);

                app.logger.info('Load plugin for ' + me.engineName + ': ' + name + ' Success.');
            } else {
                app.logger.warn(filepath + 'doesn\'t exists, load it failed.');
            }
        });

    };

    return new Viewer();

};
