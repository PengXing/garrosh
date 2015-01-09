/**
 * @file init
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  初始化res和req
 */

var _ = require('lodash');

module.exports = function (app) {

    var buildRequest = require('./buildRequest')(app);
    var buildResponse = require('./buildResponse')(app);

    return function init(req, res, next) {
        app.emit('request:start', req, res);

        res.on('finish', function () {
            app.emit('request:end', req);
        });
        buildRequest(req);
        buildResponse(res);

        // 添加接受请求的时间
        req._startTime = new Date();

        // generate pvid
        req.pvid = app.util.pvid(req._startTime);

        // 互相添加引用
        req.res = res;
        res.req = req;

        // 传递到模板中的参数
        res.locals = res.locals || {};
        // 初始化设置_headers
        res._headers = res._headers || {};

        // refer to https://github.com/ecomfe/edp-webserver/blob/master/lib/route.js#L100
        var url = require('url');
        // 在req中增加处理好的pathname，query等
        _.merge(req, url.parse(req.url, true));

        ['path', 'pathname', 'href'].forEach(function (key) {
            try {
                req[key] = decodeURIComponent(req[key]);
            } catch (ex) {
            }
        });


        app.logger.dProfile('Router:match - ' + req.pvid);
        req.route = app.router.match(req, res);
        app.logger.dProfile('Router:match - ' + req.pvid);

        next();
    };
};
