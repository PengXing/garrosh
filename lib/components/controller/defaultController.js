/**
 * @file defaultController.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var app;

var util = require('util');
var http = require('http');

var _ = require('lodash');

var BaseController = require('./baseController');

module.exports = function (app) {
    var DynamicController = require('./dynamicController')(app);

    /**
     * 处理Not Found的问题
     *
     * @param {http.ClientRequest} req request
     * @param {http.ServerResponse} res response
     * @param {Function} next next of connect
     * @constructor
     */
    function NotFoundController(req, res, next) {
        BaseController.call(this, app, req, res, next);
    }
    util.inherits(NotFoundController, BaseController);

    NotFoundController.prototype._exec = function () {
        var statusCode = this.res.statusCode;
        if (!statusCode || statusCode < 400) {
            statusCode = 404;
        }

        var config = app.config.errorHandler;
        if (config.statusCode[statusCode]) {
            config = config.statusCode[statusCode];
        }

        if (config.controller && config.action) {
            // 更改route，用的error的controller和action代替原有的
            this.req.route = {
                options: {
                    controller: config.controller,
                    action: config.action
                }
            };

            var controller = new DynamicController(this.req, this.res, this.next);
            controller.on('controller:dynamic:notFound', function () {
                app.logger.fatal(''
                    + 'NotFoundController can\'t find the error handler: controller = '
                    + config.controller
                    + ' action = '
                    + config.action
                );

                // 避免无线循环，这里应直接返回
                this.res.send(statusCode, 'Not Found');
            });

            controller.exec();
        } else {
            // 用户没有配置错误处理controller，采用自己的处理方式
            // FIXME 如果后来的人觉得默认的样式太丑，尽管在这里改

            var msg = http.STATUS_CODES[statusCode];
            msg = app.util.encodeHTML(msg);
            msg = msg.replace(/\n/g, '<br>').replace(/  /g, ' &nbsp;') + '\n';

            this.res.send(statusCode, msg);
        }
    };

    /**
     *
     * @param {Error} err err
     * @param {http.ClientRequest} req request
     * @param {http.ServerResponse} res response
     * @param {Function} next next of connect
     * @constructor
     */
    function InternalErrorController(err, req, res, next) {

        this.err = err;

        BaseController.call(this, app, req, res, next);
    }

    util.inherits(InternalErrorController, BaseController);
    InternalErrorController.prototype._exec = function () {
        var statusCode = this.res.statusCode;
        if (!statusCode) {
            statusCode = 500;
        }

        app.logger.fatal(this.err);

        var config = app.config.errorHandler;
        if (config.statusCode[statusCode]) {
            config = config.statusCode[statusCode];
        }

        if (config.controller && config.action) {
            // 更改route，用的error的controller和action代替原有的
            this.req.route.options.controller = config.controller;
            this.req.route.options.action = config.action;

            var me = this;
            var controller = new DynamicController(this.req, this.res, this.next);
            controller.on('controller:dynamic:notFound', function () {
                app.logger.fatal(''
                    + 'InternalErrorController can\'t find the error handler: controller = '
                    + config.controller
                    + ' action = '
                    + config.action
                );

                app.emit('controller:404', me.req, me.res, me.next);
            });
            // 将error对象注入到req和res中
            this.req.error = this.err;
            this.res.error = this.err;

            controller.exec();
        } else {
            // 用户没有配置错误处理controller，采用自己的处理方式
            // FIXME 如果后来的人觉得默认的样式太丑，尽管在这里改

            var msg;
            if (app.config.global.debug) {
                msg = this.err.stack || this.err.toString();
            } else {
                msg = http.STATUS_CODES[statusCode];
            }

            msg = app.util.encodeHTML(msg);
            msg = msg.replace(/\n/g, '<br>').replace(/  /g, ' &nbsp;') + '\n';

            this.res.send(statusCode, msg);
        }

    };

    function RedirectController(req, res, next) {
        BaseController.call(this, app, req, res, next);
    }
    util.inherits(RedirectController, BaseController);

    RedirectController.prototype._exec = function () {
        var options = this.req.route.options;

        // TODO (by pengxing) 这里可能有一个redirect loop的问题需要考虑
        if (options.redirect) {
            this.res.writeHead(302, {
                Location: options.redirect
            });
            this.res.end();
        } else {
            app.logger.warn('Wrong redirect target', this.req.route);
            app.emit('controller:500', new Error('Wrong redirect target'), this.req, this.res, this.next);
        }
    };

    function EmptyController(req, res, next) {
        BaseController.call(this, app, req, res, next);
    }
    util.inherits(EmptyController, BaseController);

    EmptyController.prototype._exec = function () {

        // 如果还没有结束，返回空字符
        if (!this.res.headersSent) {
            this.res.send('');
        }
    };

    return {
        NotFoundController: NotFoundController,
        InternalErrorController: InternalErrorController,
        RedirectController: RedirectController,
        EmptyController: EmptyController
    };

};
