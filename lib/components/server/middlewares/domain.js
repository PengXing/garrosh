/**
 * @file domain.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  捕获异步的exception
 */

var domain = require('domain');
var cluster = require('cluster');

module.exports = function (app) {

    return function domainMiddleware(req, res, next) {
        var d = domain.create();

        d.on('error', function (err) {
            if (err.status) {
                res.statusCode = err.status;
            }

            if (!res.statusCode || res.statusCode < 400) {
                res.statusCode = 500;
            }
            // catch exception uncaught by Connect.
            app.emit('controller:500', err, req, res, next);

            setTimeout(function () {
                try {
                    var killTimer = setTimeout(function () {
                        process.exit(1);
                    }, 10000);
                    killTimer.unref();

                    app.server.close();

                    if (cluster.worker) {
                        cluster.worker.disconnect();
                    }
                } catch (e) {
                    console.log('error when exit', e.stack);
                }
            }, 20000);

            app.logger.info('Process will exit in 30 secs.');
        });

        d.add(req);
        d.add(res);
        d.run(next);
    };

};
