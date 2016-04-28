'use strict';

describe('The dependency injection', function () {

    var nightShift = require('nightshift-core');
    var di = require('../src');
    var loggerFactory = require('./fake/fake-logger');
    var commandFactory = require('./fake/fake-command');
    var injector, console;

    beforeEach(function () {
        setUpConsole();
        setUpInjector();
    });

    function setUpConsole() {
        console = jasmine.createSpyObj('console', ['log']);
    }

    function setUpInjector() {
        nightShift.plugin(di);
        injector = nightShift.di.newInjector();
    }

    it('should inject the dependencies of the given module', function (done) {
        injector.register(console, 'console', false);
        injector.register(loggerFactory, 'logger');
        injector.resolveAll().then(function () {
            var message = 'Hello world!';
            var logger = injector.get('logger');
            logger.log(message);
            expect(console.log).toHaveBeenCalledWith(message);
            done();
        });
    });

    it('should resolve and inject the dependencies of the given module', function (done) {
        injector.register(console, 'console', false);
        injector.register(loggerFactory, 'logger');
        injector.register(commandFactory, 'command');
        injector.resolveAll().then(function () {
            var command = injector.get('command');
            command.execute();
            expect(console.log).toHaveBeenCalledWith('Executing command...');
            done();
        });
    });

    it('should configure the dependency injection', function () {
        injector.configure(module);
        injector.resolveAll().then(function (done) {
            var command = injector.get('command');
            command.execute();
            expect(console.log).toHaveBeenCalledWith('Executing command...');
            done();
        });
    });

    it('should fulfill the promise to resolve the dependencies with the injector', function (done) {
        injector.register(console, 'console', false);
        injector.register(loggerFactory, 'logger');
        injector.resolveAll().then(function (inj) {
            expect(inj).toBe(injector);
            done();
        });
    });
});