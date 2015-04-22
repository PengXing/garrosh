/**
 * @file dynamicController.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var util = require('util');
var fs = require('fs');
var path = require('path');

var BaseController = require('./baseController');

module.exports = function (app) {

    function DynamicController(req, res, next) {
        BaseController.call(this, app, req, res, next);
    }
    util.inherits(DynamicController, BaseController);

    DynamicController.prototype._exec = function () {
        var req = this.req;
        var res = this.res;
        var next = this.next;

        var options = req.route.options;

        var controllerFilePath = path.join(
            app.config.global.controllerDir,
            options.controller
        );

        if (!fs.existsSync(controllerFilePath + '.js')) {
            // 文件不存在
            app.logger.warn(controllerFilePath + ' not exists');
            this.emit('controller:dynamic:notFound', req, res, next);
            return;
        }

        var action = options.action;
        if (!action) {
            action = app.util.detectActionName(req.method);
        }

        var Clazz = require(controllerFilePath);
        if (typeof Clazz === 'function') {
            // 支持Class的方式
            var ctrl = new (Clazz)(app, req, res, next);
            if (!ctrl.getActionByName(action)) {
                app.logger.warn('No corresponding action for this request: ' + req.pathname);
                this.emit('controller:dynamic:notFound', req, res, next);
                return;
            }

            // 处理action
            ctrl.process(action);
        } else if (typeof Clazz === 'object') {
            action = Clazz[action];

            if (!action) {
                this.emit('controller:dynamic:notFound', req, res, next);
                return;
            }
            action.call(this, req, res, next);
        } else {
            app.loggger.fatal('No corresponding controller to handle ' + req.pathname);
            this.emit('controller:dynamic:notFound', req, res, next);
        }

    };


    return DynamicController;

};
