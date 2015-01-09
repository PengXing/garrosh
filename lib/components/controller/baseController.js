/**
 * @file baseController.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var util = require('util');
var events = require('events');

function BaseController(app, req, res, next) {
    events.EventEmitter.call(this);

    this.app = app;
    this.req = req;
    this.res = res;
    this.next = next;

    this.isEnded = false;

}
util.inherits(BaseController, events.EventEmitter);

BaseController.prototype.exec = function () {
    this.app.logger.dProfile(this.constructor.name + ':process - ' + this.req.pvid);

    var me = this;

    var route = this.req.route || {};
    var options = route.options || {};
    // clone middlewares
    var middlewares = options.middlewares ? options.middlewares.slice(0) : [];

    var req = me.req;
    var res = me.res;


    var app = this.app;
    // 保存controller队列
    if (req.controllers && req.controllers.length) {
        var prevController = req.controllers[req.controllers.length - 1];
        // 如果前面的controller没有结束，则结束之前的controller
        if (!prevController.isEnded) {
            prevController.destroy();
        }
        req.controllers.push(this);

        // 记录一次controller的transfer
        app.emit('controller:transfer', req.controller, me);
    } else {
        req.controllers = [this];
    }

    req.controller = this;
    req.next = me.next;
    res.next = me.next;


    app.emit('request:processing', this);

    middlewares.push(function () {
        me._exec(me.req, me.res, function () {
            // 执行connect的最后一个next方法
            me.next();
        });
    });


    // 处理middleware，让middleware串行执行
    function invokeMiddlewares(index) {
        if (!middlewares[index]) {
            return;
        }

        function _next() {
            invokeMiddlewares(++index);
        }

        var middleware = middlewares[index];
        middleware.call(me, me.req, me.res, _next);
    }

    invokeMiddlewares(0);

};

BaseController.prototype._exec = function () {

};

/**
 * Destroy
 */
BaseController.prototype.destroy = function () {
    this.isEnded = true;
    this.app.logger.dProfile(this.constructor.name + ':process - ' + this.req.pvid);
};

/**
 * Throw Exception
 * @param {Error} err err
 */
BaseController.prototype.throwException = function (err) {
    this.app.emit('controller:500', err, this.req, this.res, this.next);
};
// alias
BaseController.prototype.$500 = BaseController.prototype.throwException;

/**
 * 404
 */
BaseController.prototype.$404 = function () {
    this.app.emit('controller:404', this.req, this.res, this.next);
};


module.exports = BaseController;
