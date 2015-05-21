/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  Application
 */

var util = require('util');
var path = require('path');
var cluster = require('cluster');

var router = require('../components/router');
var controller = require('../components/controller');
var server = require('../components/server');
var viewer = require('../components/viewer');
var ral = require('../components/ral');
var config = require('../components/config');
var logger = require('../components/logger');
var session = require('../components/session');

var BaseApplication = require('./baseApplication');

function Application(appdir) {
    BaseApplication.call(this, appdir);

    this.inited = false;

    // 在创建时初始化
    this.initialize();
}
util.inherits(Application, BaseApplication);


Application.prototype.initialize = function () {
    if (this.inited) {
        return this;
    }

    // 初始化config
    this.config = config(this);
    this.config.initialize(this.appdir);
    // 直接把config暴露出来，maybe不好，但是没太多时间改了
    this.config = this.config.config;

    // 初始化logger
    this.logger = logger(this);
    this.logger.initialize();

    // 初始化router
    this.router = router(this);
    this.router.initialize();

    this.session = session(this);
    this.session.initialize();

    // 初始化runner
    this.server = server(this);
    this.server.initialize();

    this.viewer = viewer(this);
    this.viewer.initialize();

    // 初始化controller
    this.controller = controller(this);

    // 初始化ral
    this.ral = ral(this);

    this.inited = true;

};

// router相关函数
Application.prototype.all = router.all;
Application.prototype.get = router.get;
Application.prototype.post = router.post;
Application.prototype.put = router.put;
Application.prototype.del = router.del;

/**
 * 设置config
 */
Application.prototype.set = function () {

};

/**
 * 添加middleware
 * @param {string=} name name of middleware
 * @param {Function} middleware middleware function
 *
 * @return {Application}
 */
Application.prototype.middleware = function (name, middleware) {
    this.server.middleware(name, middleware);
    return this;
};

/**
 * 添加component
 * @param {string=} name name of component
 * @param {Function} component component function
 *
 * @return {Application}
 */
Application.prototype.component = function (name, component) {

    if (this[name]) {
        this.logger.warn('app.' + name + ' will be overrided.');
    }

    // 执行component函数之后的返回值赋值给app
    this[name] = component(this);

    this.logger.debug('Add component ' + name + ' SUCCESS');

    return this;
};

/**
 * Run garrosh，developer can't change anything about the app after it runs.
 *
 * @return {Application}
 */
Application.prototype.run = function () {

    var me = this;
    var config = me.config;

    if (!config.server.cluster.enable) {
        // 不支持cluster
        me.server.run();

        me.usage(config, {
            address: '0.0.0.0',
            port: config.server.port
        });
    } else {

        if (cluster.isMaster) {
            // fork workers

            var num = 1;

            if (config.server.cluster && config.server.cluster.enable) {
                num = config.server.cluster.max;
            }

            for (var i = 0; i < num; i++) {
                cluster.fork();
            }

            var started = false;
            cluster.on('exit', function (worker) {
                me.logger.fatal('worker pid: ' + worker.process.pid + ' died!');

                // 在程序还没完全启动起来之前，子进程出错直接退出，不再fork，有助于调试
                if (started) {
                    cluster.fork();
                }
            });

            var count = 0;
            cluster.on('listening', function (worker, address) {
                count++;
                if (count === num && !started) {
                    started = true;
                    me.usage(config, address);
                }
            });
        } else {

            // start server
            me.server.run();

            process.on('uncaughtException', function (err) {
                me.logger.fatal(err);
                setTimeout(function () {
                    try {
                        var killTimer = setTimeout(function () {
                            process.exit(1);
                        }, 10000);
                        killTimer.unref();

                        me.server.close();

                        if (cluster.worker) {
                            cluster.worker.disconnect();
                        }
                    } catch (e) {
                        console.log('error when exit', e.stack);
                    }

                }, 20000);

                me.logger.info('Process will exit in 30 secs.');
            });
        }

    }

    return this;
};

Application.prototype.usage = function (config, address) {
    console.log('\n====================================================');
    console.log('PID          : ' + process.pid);
    console.log('node.js      : ' + process.version);
    console.log('====================================================');
    console.log('Name         : ' + config.global.appname);
    console.log('Appdir       : ' + path.resolve(config.global.appdir));
    console.log('Version      : ' + config.global.version);
    console.log('Author       : ' + config.global.author.join(' '));
    console.log('Date         : ' + new Date());
    console.log('Mode         : ' + (config.global.debug ? 'development' : 'production'));
    console.log('====================================================\n');
    console.log('Listen to ' + address.address + ':' + address.port);
    console.log('');

};

module.exports = Application;
