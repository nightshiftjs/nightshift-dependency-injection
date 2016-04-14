# nightshift-dependency-injection
Dependency injection is a cornerstone of NightShift. It reduces the coupling between the modules and increases their testability.

## Less Coupling, More Testability
A module that uses `require` to get its dependencies can hardly be tested in isolation, i.e. tested without (re-)testing its dependencies. As an example, because the `greeter` below requires a `logger`, that `logger` will be involved when testing the `greeter`.

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

```
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
injector.resolveAll().then(function () {...});
```

### register(object, key, isToBeResolved)
The method `injector.register(object, key, isToBeResolved)` registers the given object for dependency injection. 

- `object` can be either a factory function expecting dependencies, either any plain object (e.g. global objects, third-party objects).
- `key` is the unique identifier of the object in the injector. It is used to inject the object in other objects: the dependencies expected by a factory function are resolved by matching parameter names to keys. The key can also be used to retrieve the object from the injector by using `injector.get(key)`. The key is optional. If no key is given, then the object will be resolved but it cannot be injected. This is useful for void functions relying on dependencies in order to do some setup.
- `isToBeResolved` is a boolean indicating whether the given object is a factory function expecting dependencies (`isToBeResolved = true`) or a plain object (`isToBeResolved = false`). It defaults to `true`. If no key is given, then it is always set to `true`.  

### resolveAll()
The method `injector.resolveAll()` resolves all the objects which have been registered for dependency injection. It invokes the factory functions with the dependencies they expect. It makes the resulting objects available for dependency injection. It returns a promise.

### get(key)
The method `injector.get(key)` returns the object with the given key.
 
### configure(module, configFilePattern)
The method `injector.configure(module, configFilePattern)` configures the injector by executing the configuration functions which are exported by the modules whose file name matches the given pattern.

- `module` is the Node.js module that takes care of configuring the injector, typically the main module.
- `configFilePattern` is the file pattern used to search for configuration modules. By default, it matches all the files ending with _.di.js_ and located either next to, either below the given module. Note that the pattern must be relative to that module. 

## Pros
- The modules are more testable.
- The modules are decoupled from each other.
- The dependency injection is non-intrusive.
- The dependency injection can be plugged in existing code.
- The structural coupling that can exist between the modules disappears: forget about `require('../../../...')`!
- Since the dependencies are resolved based on theirs names, the naming conventions are enforced. An object will always have the same name and its usages will therefore be easy to find.

## Tests
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
