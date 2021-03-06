# nightshift-dependency-injection

[![Build Status][build]](https://travis-ci.org/nightshiftjs/nightshift-dependency-injection) 

[![Coverage Status][coverage]](https://coveralls.io/github/nightshiftjs/nightshift-dependency-injection)
 
[![Dependencies Status][deps]](https://david-dm.org/nightshiftjs/nightshift-dependency-injection)

[build]: https://travis-ci.org/nightshiftjs/nightshift-dependency-injection.svg?branch=master
[coverage]: https://coveralls.io/repos/github/nightshiftjs/nightshift-dependency-injection/badge.svg?branch=master
[deps]: https://david-dm.org/nightshiftjs/nightshift-dependency-injection.svg

Dependency injection is a cornerstone of [NightShift](https://github.com/nightshiftjs). It reduces the coupling between the modules and increases their testability.

## Less Coupling, More Testability
A module that uses `require` to get its dependencies can hardly be tested in isolation, i.e. tested without retesting its dependencies. As an example, because the `greeter` below requires a `logger`, that `logger` will be involved when testing the `greeter`.

```javascript
var logger = require('logger');

var greeter = function (person) {
    logger.log('Hello, ' + person);  
};

module.exports = greeter;
```

The idea of the dependency injection is to invert the control: instead of requiring its dependencies, a module receives them. 

```javascript
var greeterFactory = function (logger) {
    return function greeter(person) {
        logger.log('Hello, ' + person);  
    };                         
};

module.exports = greeterFactory;
```

Basically, the module now exports a factory function receiving the `logger` that it used to `require`. Because the `greeter` and the `logger` are decoupled, the `logger` can easily be mocked when testing the `greeter`.

## Setup
Dependency injection can be added to NightShift as a plugin.

```javascript
var nightShift = require('nightshift-core');
var di = require('nightshift-dependency-injection');

nightShift.plugin(di);
```

## The Injector
The injector is the object in charge of injecting the dependencies. A new injector can be created as below.

```javascript
var injector = nightShift.di.newInjector();
```  

All the factory functions expecting dependencies must first be registered in the injector. Plain objects can be registered too (e.g. global objects, third-party objects). The registration order does not matter.

```javascript
// the greeter module exports a factory function that expects a logger to be passed as a parameter
var greeterFactory = require('./greeter');
injector.register(greeterFactory, 'greeter');

// the logger is a third-party object, it does not expect any dependency to be passed
var logger = require('logger');
injector.register(logger, 'logger', false);
``` 

Once all the objects have been registered, the dependencies can be resolved. The factory functions will be invoked with the dependencies they expect. The objects they return will be made available for dependency injection.

```javascript
// the method resolveAll returns a promise
injector.resolveAll().then(function () {...});
```

Once the dependencies have been resolved, objects can be retrieved from the injector based on their key.

```javascript
var greeter = injector.get('greeter');
greeter('John Doe');
```

The injector is typically configured by the main module. However, registering all the objects in one single module can be cumbersome. That's why there is a way to spread the configuration of the injector across many modules. As an example, let's consider the structure below.

```javascript
    /
    |_index.js                      
    |_ logger/              
        |_ logger.js
        |_ logger.di.js     
    |_ greeter/              
        |_ greeter.js
        |_ greeter.di.js     
```

The injector is able to search for all the modules whose file name matches a given pattern. By default, if no pattern is specified, then the injector will search for all the files ending with _.di.js_. Those modules are expected to export functions which receive the injector as a parameter. Such a function can register new objects in the injector. As an example, let's have a look at the file _greeter.di.js_.

```javascript
module.exports = function configure(injector) {
    injector.register(require('./greeter'), 'greeter');
};
```

Let's also have a look at the file _logger.di.js_.

```javascript
module.exports = function configure(injector) {
    injector.register(require('./logger'), 'logger');
};
```

The only thing that needs to be done in the file _index.js_ is making sure that the injector is configured.

```javascript
// plug the dependency injection
var nightShift = require('nightshift-core');
var di = require('nightshift-dependency-injection');
nightShift.plugin(di);

// create a new injector
var injector = nightShift.di.newInjector();

// configure the injector
injector.configure(module);

// resolve the dependencies
injector.resolveAll().then(function () {
    var greeter = injector.get('greeter');
    greeter('John Doe');
});
```

### register(object, key, isToBeResolved)
The method `injector.register(object, key, isToBeResolved)` registers the given object for dependency injection. 

- `object` can be either a factory function expecting dependencies, either any plain object (e.g. global objects, third-party objects).
- `key` is the unique identifier of the object in the injector. It is used to inject the object in other objects: the dependencies expected by a factory function are resolved by matching parameter names to keys. The key can also be used to retrieve the object from the injector by using `injector.get(key)`. The key is optional. If no key is given, then the object will be resolved but it cannot be injected. This is useful for void functions relying on dependencies in order to do some setup.
- `isToBeResolved` is a boolean indicating whether the given object is a factory function expecting dependencies (`isToBeResolved = true`) or a plain object (`isToBeResolved = false`). It defaults to `true`. If no key is given, then it is always set to `true`.  

### resolveAll()
The method `injector.resolveAll()` resolves all the objects which have been registered for dependency injection. It invokes the factory functions with the dependencies they expect. It makes the resulting objects available for dependency injection. It returns a promise that is fulfilled with the ```injector```.

### get(key)
The method `injector.get(key)` returns the object with the given key.
 
### configure(module, configFilePattern)
The method `injector.configure(module, configFilePattern)` configures the injector by executing the configuration functions which are exported by the modules whose file name matches the given pattern.

- `module` is the Node.js module that takes care of configuring the injector, typically the main module.
- `configFilePattern` is the file pattern used to search for configuration modules. By default, it matches all the files ending with _.di.js_ and located either next to, either below the given module. Note that the pattern must be relative to that module. 

## Real Life Example
### Booting a web application
Let's take as an example a web application whose source code is structured as below.

```javascript
    /
    |_ app.js               // the main module
    |_ boot.js              // the module in charge of booting the application          
    |_ di.js                // the module in charge of configuring the injector
    |_ env.js               // the module in charge of configuring the environment
    |_ feature1/            // a feature            
        |_ ...              // whatever module(s) for feature 1
        |_ feature1.di.js   // the module in charge of enriching the injector with feature 1     
    |_ feature2/            // another feature         
        |_ ...              // whatever module(s) for feature 2
        |_ feature2.di.js   // the module in charge of enriching the injector with feature 2
    |_ ...                  // other features
```

Let's first have a look at _di.js_, the module that is responsible for configuring the injector.

```javascript
module.exports = function configureDependencyInjection(nightShift) {
    // create a new injector
    var injector = nightShift.di.newInjector();

    // enrich the injector with global variables
    injector.register(console, 'console', false);
    injector.register(process, 'process', false);

    // enrich the injector with external dependencies
    injector.register(require('http'), 'http', false);

    // enrich the injector with internal dependencies
    injector.register(require('./boot'), 'boot');
    injector.register(require('./env'), 'configureEnvironment');
    injector.configure(module);

    // promise to resolve the dependencies
    return injector.resolveAll();
};
```

As you can see, different things are made available for dependency injection: global variables, external and internal dependencies. Most of the internal dependencies are registered automatically by using ```injector.configure(module)```.

Knowing what is available for dependency injection, let's now have a look at the main module, _app.js_.

```javascript
// configure NightShift
var nightShift = require('nightshift-core');
var di = require('nightshift-dependency-injection');
nightShift.plugin(di);

// configure the dependency injection
require('./di')(nightShift).then(function (injector) {

    // configure the environment (defaults to 'development')
    var env = process.env.NODE_ENV || 'development';
    var config = injector.get('configureEnvironment')(env);

    // boot
    injector.get('boot')(config);
});
```

_app.js_ and _di.js_ are the only modules for which dependency injection is not available. All the other modules can benefit from dependency injection. Let's have a look at _env.js_, the module that is responsible for configuring the environment.
 
```javascript
module.exports = function createEnvironmentConfigurationFunction(process) {
    return function configureEnvironment(env) {
        return {
            // the environment (e.g. development, test, production)
            env: env,

            // the port the server is running on
            port: parseInt(process.env.PORT) || 9000
        };
    };
};
```

Based on the configuration object created above, the application can be booted by the module _boot.js_.

```javascript
module.exports = function createBootFunction(http) {
    return function boot(config) {

        // Create HTTP server
        var server = http.createServer(function (request, response) {
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end('Welcome to ' + config.env);
        });

        // Start HTTP server
        server.listen(config.port);
    };
};
```

Such an implementation clearly separates the concerns in different modules which are easy to test.

## Pros
- The modules are more testable.
- The modules are decoupled from each other.
- The dependency injection is non-intrusive.
- The dependency injection can be plugged in existing code.
- The structural coupling that can exist between the modules disappears: forget about `require('../../../...')`!
- Since the dependencies are resolved based on theirs names, the naming conventions are enforced. An object will always have the same name and its usages will therefore be easy to find.

## Cons
Still trying to find one...

## Tips
- You can make `nightShift` available for dependency injection.

```javascript
// configure the injector
injector.register(nightShift, 'nightShift', false);
injector.configure(module);
```
 
- You can make specific parts of `nightShift` available for dependency injection.

```javascript
// configure the injector
injector.register(nightShift.functions, 'functions', false);
injector.configure(module);
```

- You can make global objects available for dependency injection. This makes it possible to mock them when testing.

```javascript
// configure the injector
injector.register(console, 'console', false);
injector.configure(module);
```

## Contribute
The tests can be executed by running the command below.
```
npm install && npm test
```

The test coverage can be checked by running the command below. It executes the tests and it generates a coverage report in _build/coverage/index.html_.
```
npm install && npm build-coverage
```

The quality of the code can be checked by running the command below. It detects potential problems in the code with JSHint, it executes the tests and it generates a coverage report. 
```
npm install && npm build
```

## Note
The NightShift plugin for dependency injection relies on [Wiretree](http://wiretree.jacoborus.codes/) .
