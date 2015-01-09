/**
 * @file staticController.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var app;

var util = require('util');
var path = require('path');
var fs = require('fs');

var send = require('send');

var BaseController = require('./baseController');

function StaticController(req, res, next) {
    BaseController.call(this, app, req, res, next);


}
util.inherits(StaticController, BaseController);

StaticController.prototype._exec = function () {
    var req = this.req;
    var res = this.res;

    var options = req.route.options;

    var config = app.config.global;
    var staticDir = config.staticDir || path.join(config.appdir, 'public');

    // 如果配置中有documentRoot，则采用配置中的documentRoot
    if (options.documentRoot) {
        staticDir = options.documentRoot;
    }

    var pathname = req.pathname;
    // 如果options中有target，则用target作为当前请求的pathname
    if (options.target) {
        pathname = options.target;
    }

    // 检查文件是否存在
    if (!fs.existsSync(path.join(staticDir, pathname))) {
        res.send(404, 'Not Found');
        return;
    }

    function redirect() {
        res.statusCode = 301;
        res.setHeader('Location', req.url + '/');
        res.end('Redirecting to ' + req.url + '/');
    }

    function error(err) {
        res.statusCode = err.status || 500;
        res.end(err.message);
    }

    var s = send(req, pathname, {
        root: staticDir,
        dotfiles: options.dotfiles,
        etag: options.etag || app.config.server.etag,
        extensions: options.extensions,
        index: options.index,
        maxAge: options.maxAge
    });
    s.on('error', error);
    s.on('directory', redirect);
    s.pipe(res);
};


module.exports = function (application) {
    app = application;
    return StaticController;
};
