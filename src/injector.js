'use strict';

function createInjector(Q, wiretreeFactory, uuid, _) {
    var tree = wiretreeFactory(__dirname);

    /**
     * Registers the specified object for dependency injection.
     *
     * @param {Object} object the object to register for dependency injection
     * @param {String} [key] the key to use for injecting the object (if no key is specified, then the object can be resolved but not injected)
     * @param {Boolean} [isToBeResolved=true] whether or not the object needs to be resolved before being injected
     */
    function register(object, key, isToBeResolved) {
        if (_.isString(key)) {
            isToBeResolved = _.isBoolean(isToBeResolved) ? isToBeResolved : true;
        } else {
            key = '_' + uuid.v1();
            isToBeResolved = true;
        }
        tree.add(key, isToBeResolved ? {wiretree: object} : object);
    }

    /**
     * Resolves all the objects which have been registered for dependency injection.
     *
     * @returns {Promise} the promise to resolve all the registered objects
     */
    function resolveAll() {
        var deferred = Q.defer();
        tree.resolve(function () {
            deferred.resolve();
        });
        return deferred.promise;
    }

    /**
     * Gets the object with the specified key.
     *
     * @param {String} key the key of the object to get
     * @returns {Object} the object with the specified key
     */
    function get(key) {
        return tree.get(key);
    }

    return {
        register: register,
        resolveAll: resolveAll,
        get: get
    };
}

module.exports = function createInjectorFactoryNoArg(Q, wiretreeFactory, uuid, _) {
    return function () {
        return createInjector(Q, wiretreeFactory, uuid, _);
    };
};