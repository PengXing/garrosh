/**
 * @file index.js
 * @author sekiyika (px.pengxing@gmail.com)
 * @description
 *
 */

var util = require('util');
var events = require('events');
var crypto = require('crypto');

var _ = require('lodash');

module.exports = function (app) {


    function Session() {
        events.EventEmitter.call(this);

        /**
         * 用于express.session的config
         * @type {{}}
         */
        this.config = {};

    }

    util.inherits(Session, events.EventEmitter);

    Session.prototype.initialize = function () {

        if (!app.config.session.enable) {
            return;
        }

        app.logger.dProfile('component:Session:initialize');

        // merge session config to this.config for middleware
        _.merge(this.config, app.config.session.session);

        if (!this.config.secret) {
            if (process.env.NODE_ENV === 'production') {
                app.logger.warn('Automatically generating one for now...');
                app.logger.error('This generated session secret is NOT OK for production!');
                app.logger.error('It will change each time the server starts and break multi-instance deployments.\n');
                app.logger.error('To set up a session secret, add or update it in `config/session.js`:');
                app.logger.error('module.exports = { secret: "keyboard cat" }');

                throw new Error('Session secret must be identified!');
            } else {
                this.config.secret = generateSecret();
            }
        }

        this._createStore();

        app.logger.dProfile('component:Session:initialize');
        app.logger.info('Component Session initialize DONE');
    };

    Session.prototype._createStore = function () {
        var config = app.config.session;

        var MemoryStore = require('connect').session.MemoryStore;

        var store;
        if (config.adapter) {
            if (typeof config.adapter === 'string') {
                // 采用memory redis mongo
                if (config.adapter === 'memory') {
                    store = new MemoryStore();
                } else {
                    // 符合connect session的规范
                    var sessionAdapter = require(config.adapter);
                    var Store = sessionAdapter(require('connect').session);
                    store = new Store(config.options);
                }
            } else {
                store = config.adapter;
            }

        } else {
            store = new MemoryStore();
        }

        this.config.store = store;
    };

    Session.prototype.get = function (sid, cb) {
        if (typeof cb !== 'function') {
            throw new Error('Invalid usage :: `session.get(sid, cb)`');
        }

        this.config.store.get(sid, cb);
    };

    Session.prototype.set = function (sid, session, cb) {
        cb = cb || function () {};
        this.config.store.set(sid, session, cb);
    };

    function generateSecret() {
        // Combine random and case-specific factors into a base string
        var factors = {
            creationDate: (new Date()).getTime(),
            random: Math.random() * (Math.random() * 1000),
            nodeVersion: process.version
        };
        var basestring = '';
        _.each(factors, function (val) {
            basestring += val;
        });

        // Build hash
        var hash = crypto.createHash('md5').update(basestring).digest('hex');

        return hash;
    }

    return new Session();

};
