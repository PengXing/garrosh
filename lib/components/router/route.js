/**
 * @file route.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *  route
 */


function Route() {
    this.fn;
    this.name;
    this.method;
    /**
     * options.middlewares
     *
     * options.controller
     * options.action
     *
     * options.type
     * options.dir
     *
     * options.redirect
     *
     * @type {{}}
     */
    this.options;

    /**
     * @type {boolean}
     */
    this.isRegExp;
}

/**
 * 查看是否匹配
 *
 * @param req
 * @param res
 * @returns {*}
 */
Route.prototype.match = function (req, res) {
    return this.fn(req, res);
};

module.exports = Route;