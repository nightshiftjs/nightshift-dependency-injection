'use strict';

function Injector(promises, wiretreeFactory, uuid, _, glob, path) {
    var injector = this;
    var tree = wiretreeFactory();

    /**
     * This method registers the given object for dependency injection.
     *
     * @param {Object} object the object can be either a factory function expecting dependencies, either any plain
     * object (e.g. global objects, third-party objects).
     *
     * @param {String} [key] the key is the unique identifier of the object in the injector. It is used to inject the
     * object in other objects: the dependencies expected by a factory function are resolved by matching parameter names
     * to keys. The key can also be used to retrieve the object from the injector by using <i>injector.get(key)</i>. The
     * key is optional. If no key is given, then the object will be resolved but it cannot be injected. This is useful
     * for void functions relying on dependencies in order to do some setup.
     *
     * @param {Boolean} [isToBeResolved=true] <i>isToBeResolved</i> is a boolean indicating whether the given object is
     * a factory function expecting dependencies (<i>isToBeResolved = true</i>) or a plain object
     * (<i>isToBeResolved = false</i>). It defaults to <i>true</i>. If no key is given, then it is always set to
     * <i>true</i>.
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
     * This method resolves all the objects which have been registered for dependency injection. It invokes the factory
     * functions with the dependencies they expect. It makes the resulting objects available for dependency injection.
     *
     * @returns {Promise} the promise to resolve all the registered objects
     */
    injector.resolveAll = function () {
        var deferred = promises.defer();
        tree.resolve(function () {
            deferred.resolve(injector);
        });
        return deferred.promise;
    };

    /**
     * This method returns the object with the given key.
     *
     * @param {String} key the key of the object to get
     *
     * @returns {Object} the object with the given key
     */
    injector.get = function (key) {
        return tree.get(key);
    };

    /**
     * The injector is typically configured by the main module. However, registering all the objects in one single
     * module can be cumbersome. That's why there is a way to spread the configuration of the injector across many
     * modules.
     *
     * As an example, let's consider the structure below.
     * <pre><code>
     *      /
     *      |_index.js
     *      |_ logger/
     *          |_ logger.js
     *          |_ logger.di.js
     *      |_ greeter/
     *          |_ greeter.js
     *          |_ greeter.di.js
     * </code></pre>
     *
     * The injector is able to search for all the modules whose file name matches a given pattern. By default, if no
     * pattern is specified, then the injector will search for all the files ending with <i>.di.js</i>. Those modules
     * are expected to export functions which receive the injector as a parameter. Such a function can register new
     * objects in the injector.
     *
     * As an example, let's have a look at the file <i>greeter.di.js</i>.
     * <pre><code>
     *      module.exports = function (injector) {
     *          injector.register(require('./greeter'), 'greeter');
     *      };
     * </code></pre>
     *
     * Let's also have a look at the file <i>logger.di.js</i>.
     * <pre><code>
     *      module.exports = function (injector) {
     *          injector.register(require('./logger'), 'logger');
     *      };
     * </code></pre>
     *
     * The only thing that needs to be done in the file <i>index.js</i> is making sure that the injector is configured.
     * <pre><code>
     *      // plug the dependency injection
     *      var nightShift = require('nightshift-core');
     *      var di = require('nightshift-dependency-injection');
     *      nightShift.plugin(di);
     *
     *      // create a new injector
     *      var injector = nightShift.di.newInjector();
     *
     *      // configure the injector
     *      injector.configure(module);
     *
     *      // resolve the dependencies
     *      injector.resolveAll().then(function () {...});
     * </code></pre>
     *
     * @param {Object} module the Node.js module that takes care of configuring the dependency injection, typically the
     * main module
     *
     * @param {String} [configFilePattern] the file pattern used to search for configuration modules, by default
     * all the files ending with <i>.di.js</i> and located either next to, either below the given module (note that the
     * pattern must be relative to that module)
     */
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

module.exports = function createInjectorFactoryNoArg(promises, wiretreeFactory, uuid, _, glob, path) {
    return function () {
        return new Injector(promises, wiretreeFactory, uuid, _, glob, path);
    };
};