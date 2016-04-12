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

Basically, the module now exports a factory function that receives the `logger` it used to `require`. Because the `greeter` and the `logger` are decoupled, the `logger` can easily be mocked when testing the `greeter`.

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

All the factory functions must first be registered in the injector. Plain objects can be registered too (e.g. global objects, third-party objects). The registration order does not matter.

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

## Tests

```
npm install && npm test
```

## Note
The NightShift plugin for dependency injection relies on [Wiretree](http://wiretree.jacoborus.codes/) .
