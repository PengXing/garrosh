/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */


var Deferred = require('underscore.deferred').Deferred;
var _ = require('lodash');

module.exports = function (app) {

    function Ral() {

        /**
         * @type {RAL}
         */
        this._ral;

        this.initialize();
    }

    Ral.prototype.initialize = function () {
        app.logger.dProfile('component:Ral:initialize');


        var config = app.config.ral;
        var adapter = config.adapter;

        var RAL;
        var RALConfig;

        try {
            adapter = require(adapter);
            RAL = adapter.RAL;
            RALConfig = adapter.Config;
        } catch (e) {
            app.logger.fatal(config.adapter + ' doesn\'t exists. Please add it to dependencies.');
            app.logger.fatal('Init Ral failed.');

            return;
        }

        RAL.init({
            confDir: __dirname,
            logger: {
                /* eslint-disable */
                log_path: app.config.logger.dir,
                /* eslint-enable */
                app: 'ral'
            }
        });

        // ral的配置信息
        config = {};

        // 配置在ral.js文件中的service
        _.merge(config, app.config.ral.service);
        // 配置在config/service目录中的service
        _.merge(config, app.config.service);

        RALConfig.loadRawConf(config);

        this._ral = RAL;

        app.logger.dProfile('component:Ral:initialize');
        app.logger.info('Component Ral initialize DONE');
    };

    Ral.prototype.ral = function (service, options) {
        options = options || {};

        var dfd = new Deferred();

        // 设置timeout的值
        var config = app.config.ral.service[service];
        if (!config.timeout || config.timeout > app.config.ral.timeout) {
            options.timeout = app.config.ral.timeout;
        }
        options.retry = app.config.ral.retry;

        var request = this._ral(service, options);

        request.on('data', function (data) {
            dfd.resolve(data);
        });
        request.on('error', function (error) {
            dfd.reject(error);
        });

        return dfd;
    };

    // 新建ral的实例
    var ral = new Ral();

    return function () {
        return ral.ral.apply(ral, Array.prototype.slice.call(arguments, 0));
    };

};
