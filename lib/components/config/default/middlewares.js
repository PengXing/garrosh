/**
 * @file middlewares.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */


module.exports = {

    // 支持connect和internal
    middlewares: [

        // 'internal.timeout',
        /*
        function (app) {
            return function (req, resp, next) {
                app.logger.silly('I am a middleware.');
                next();
            }
        },
        {
            name: 'firstArg',
            fn: function (firstArg, app) {
                var arg = firstArg;

                return function (req, resp, next) {
                    app.logger.silly(arg);
                    next();
                };
            },
            args: [ 'first_arg' ]
        }
        */
    ]

};
