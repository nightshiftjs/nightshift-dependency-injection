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
module.exports = function (injector) {
    injector.register(require('./greeter'), 'greeter');
};
```

Let's also have a look at the file _logger.di.js_.

```javascript
module.exports = function (injector) {
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

As you have probably noticed, the structural coupling that can exist between the modules has completely disappeared. There is no need to `require('../../../...')` anymore! 

## Tests

```
npm install && npm test
```

## Note
The NightShift plugin for dependency injection relies on [Wiretree](http://wiretree.jacoborus.codes/) .
