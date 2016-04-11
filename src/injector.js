'use strict';

function Injector(Q, wiretreeFactory, uuid, _, glob, path) {
    var injector = this;
    var tree = wiretreeFactory();

    /**
     * This method registers the given object for dependency injection.
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
     * This method resolves all the objects which have been registered for dependency injection.
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
     * This method returns the object with the given key.
     *
     * @param {String} key the key of the object to get
     * @returns {Object} the object with the given key
     */
    injector.get = function (key) {
        return tree.get(key);
    };

    /**
     * This method can be used to automatically register for dependency injection all the objects which are listed in
     * configuration modules. A configuration module just has to export a function that receives the injector as a
     * parameter. By using that injector, the function can register whatever objects for dependency injection, typically
     * objects which are exported by modules located in the same folder.
     *
     * As an example, let's consider the structure below:
     * <pre><code>
     *      index.js
     *          |_ feature1/
     *              |_ feature1.module1.js
     *              |_ feature1.module2.js
     *              |_ feature1.di.js
     *          |_ feature2/
     *              |_ feature2.module1.js
     *              |_ feature2.module2.js
     *              |_ feature2.di.js
     * </code></pre>
     *
     * <i>feature1.di.js</i> registers <i>feature1.module1.js</i> and <i>feature1.module2.js</i>.
     * <pre><code>
     *      module.exports = function (injector) {
     *          injector.register(require('./feature1.module1'), 'key1');
     *          injector.register(require('./feature1.module2'), 'key2');
     *      };
     * </code></pre>
     *
     * <i>feature2.di.js</i> registers <i>feature2.module1.js</i> and <i>feature2.module2.js</i>.
     * <pre><code>
     *      module.exports = function (injector) {
     *          injector.register(require('./feature2.module1'), 'key3');
     *          injector.register(require('./feature2.module2'), 'key4');
     *      };
     * </code></pre>
     *
     * <i>index.js</i> makes sure that the configuration functions are invoked.
     * <pre><code>
     *      nightShift.di.configure(module);
     * </code></pre>
     *
     * @param {Object} module the module that takes care of configuring the dependency injection, typically the main module
     * @param {String} [configFilePattern] the file pattern used to search for configuration modules, by default
     * all the files ending with .di.js and located either next to, either below the given module (note that the
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

module.exports = function createInjectorFactoryNoArg(Q, wiretreeFactory, uuid, _, glob, path) {
    return function () {
        return new Injector(Q, wiretreeFactory, uuid, _, glob, path);
    };
};