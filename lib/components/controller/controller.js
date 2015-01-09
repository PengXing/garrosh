/**
 * @file controller.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  提供给外部继承的base controller，只能用于动态请求
 */

function Controller(app, req, res, next) {

    this.app = app;
    this.req = req;
    this.res = res;
    this.next = next;

    var me = this;

    // 代理response的方法
    var respMethods = [
        'set', 'header', 'type', 'location', 'vary',
        'link', 'status', 'send', 'json', 'jsonp',
        'sendfile', 'redirect', 'forward', 'render'
    ];

    respMethods.forEach(function (name) {
        me[name] = function () {
            return me.res[name].apply(me.res, Array.prototype.slice.call(arguments, 0));
        };
    });

    // 代理request的方法
    var reqMethods = [
        'acceptsLanguages', 'acceptsEncodings', 'acceptsCharsets',
        'accepts', 'param', 'get'
    ];
    reqMethods.forEach(function (name) {
        me[name] = function () {
            return me.req[name].apply(me.req, Array.prototype.slice.call(arguments, 0));
        };
    });
}


Controller.prototype = {

    layout: ''

};

/**
 * 获取filters
 * @return {Object}
 */
Controller.prototype.filters = function () {
    return {};
};


Controller.prototype.process = function (action) {
    var me = this;

    // 处理filter
    // TODO

    // 调用 action
    action = me.getActionByName(action);

    var params = me.app.util.getFuncParams(action);
    var realParams = [];
    if (params && params.length > 0) {
        // 认为这是需求参数
        params.forEach(function (p) {
            p = me.param(p);
            realParams.push(p);
        });
    }
    action.apply(this, realParams);
};

Controller.prototype.getActionByName = function (name) {

    // 有必要规定action都以action开头，不然用户可以随意访问Controller里面的方法

    // 隐藏下划线开头的函数
    if (name.indexOf('_') === 0) {
        return false;
    }
    name = 'action' + name[0].toUpperCase() + name.substring(1);

    return this[name];
};

Controller.prototype.destroy = function () {

    this.next();
};


module.exports = Controller;
