/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  加载config
 */

var path = require('path');
var fs = require('fs');

var _ = require('lodash');
var glob = require('glob');


module.exports = function (app) {

    function Configuration() {

        /**
         * @type {string}
         */
        this._appdir;

        /**
         * @type {Object}
         */
        this.config = {};

    }

    /**
     * 初始化
     * @param {string} appdir 程序运行的根目录，如果为空，则用当前程序运行目录
     */
    Configuration.prototype.initialize = function (appdir) {

        if (!appdir) {
            appdir = process.cwd();
        }

        this._appdir = appdir;
        this._load();


        if (this.config.global.debug) {
            process.env.NODE_ENV = 'development';
        } else {
            process.env.NODE_ENV = 'production';
        }

    };

    /**
     * 加载config
     * @private
     */
    Configuration.prototype._load = function () {
        var me = this;

        // 优先加载global，需要设置process.env.NODE_ENV，以便其他的配置能用
        var globalFilePath = path.join(me._appdir, 'config/global.js');
        if (fs.existsSync(globalFilePath)) {
            var globalConfig = require(globalFilePath);
            if (!globalConfig.debug) {
                process.env.NODE_ENV = 'production';
            } else {
                process.env.NODE_ENV = 'development';
            }
        }

        var cwd = __dirname + '/default';
        // 加载默认配置
        var files = glob.sync('**/*.js', {
            cwd: cwd,
            root: '/'
        });

        files.forEach(function (filepath) {
            filepath = filepath.substring(0, filepath.length - 3);

            me.apply2Config(filepath, require(cwd + '/' + filepath));
        });

        // 记在用户的配置
        cwd = path.join(me._appdir, 'config');
        files = glob.sync('**/*.js', {
            cwd: cwd
        });

        files.forEach(function (filepath) {
            filepath = filepath.substring(0, filepath.length - 3);

            me.apply2Config(filepath, require(cwd + '/' + filepath));
        });

        me.convertToAbsolutePath();
    };


    /**
     * 将配置文件转换为object挂在_config上
     * @param {string} filepath filepath
     * @param {Object} obj obj
     */
    Configuration.prototype.apply2Config = function (filepath, obj) {
        var paths = filepath.split(path.sep);

        var o = this.config;
        for (var i = 0, l = paths.length; i < l - 1; i++) {
            o[paths[i]] = {};
            o = o[paths[i]];
        }

        var name = paths[paths.length - 1];
        if (o[name]) {
            o[name] = _.merge(o[name], obj);
        } else {
            o[name] = obj;
        }

    };

    /**
     * 将一些dir转换为绝对地址
     */
    Configuration.prototype.convertToAbsolutePath = function () {

        // 设置config中的appdir为处理后的appdir
        this.config.global.appdir = app.util.resolve(this.config.global.appdir, this._appdir);

        var appdir = this.config.global.appdir;

        this.config.global.staticDir = app.util.resolve(this.config.global.staticDir, appdir);
        this.config.global.controllerDir = app.util.resolve(this.config.global.controllerDir, appdir);
        this.config.global.middlewareDir = app.util.resolve(this.config.global.middlewareDir, appdir);
        this.config.global.templateDir = app.util.resolve(this.config.global.templateDir, appdir);
        this.config.global.pluginDir = app.util.resolve(this.config.global.pluginDir, appdir);

        this.config.logger.dir = app.util.resolve(this.config.logger.dir, appdir);
    };

    /**
     * 根据key获取对应的属性，例如
     *  app.config.get('global.debug')
     *  app.config.get('service.dataloader.host')
     *
     * 该方法暂时还没有用
     *
     * @param {string} key config key
     * @return {*}
     */
    Configuration.prototype.get = function (key) {
        var paths = key.split('.');

        var o = this.config;
        for (var i = 0, l = paths.length; i < l - 1; i++) {
            o = o[paths[i]];
            if (!o) {
                return undefined;
            }
        }

        var name = paths[paths.length - 1];
        return o[name];
    };

    /**
     * Set config
     *
     * @param {string} key key
     * @param {*} value value
     *
     * @return {boolean}
     */
    Configuration.prototype.set = function (key, value) {
        var paths = key.split('.');

        var o = this.config;
        for (var i = 0, l = paths.length; i < l - 1; i++) {
            o = o[paths[i]];
            if (!o) {
                return false;
            }
        }

        var name = paths[paths.length - 1];
        o[name] = value;

        return true;
    };

    return new Configuration();
};
