'use strict';

function Injector(Q, wiretreeFactory, uuid, _, glob, path) {
    var injector = this;
    var tree = wiretreeFactory();

    /**
     * Registers the given object for dependency injection.
     *
     * @param {Object} object the object to register for dependency injection
     * @param {String} [key] the key to use for injecting the object (if no key is given, then the object can be resolved but not injected)
     * @param {Boolean} [isToBeResolved=true] whether or not the object needs to be resolved before being injected
     */
    injector.register = function (object, key, isToBeResolved) {
        if (_.isString(key)) {
            isToBeResolved = _.isBoolean(isToBeResolved) ? isToBeResolved : true;
        } else {
            key = '_' + uuid.v1();
            isToBeResolved = true;
        }
        tree.add(key, isToBeResolved ? {wiretree: object} : object);
    };

    /**
     * Resolves all the objects which have been registered for dependency injection.
     *
     * @returns {Promise} the promise to resolve all the registered objects
     */
    injector.resolveAll = function () {
        var deferred = Q.defer();
        tree.resolve(function () {
            deferred.resolve();
        });
        return deferred.promise;
    };

    /**
     * Gets the object with the given key.
     *
     * @param {String} key the key of the object to get
     * @returns {Object} the object with the given key
     */
    injector.get = function (key) {
        return tree.get(key);
    };

    injector.configure = function (module, configFilePattern) {
        configFilePattern = configFilePattern ? configFilePattern : '*/**/*.di.js';
        var configFiles = glob.sync(configFilePattern, {
            cwd: path.dirname(module.filename)
        });
        _.forEach(configFiles, function (configFile) {
            var configFn = module.require('./' + configFile);
            configFn(injector);
        });
    };
}

module.exports = function createInjectorFactoryNoArg(Q, wiretreeFactory, uuid, _, glob, path) {
    return function () {
        return new Injector(Q, wiretreeFactory, uuid, _, glob, path);
    };
};