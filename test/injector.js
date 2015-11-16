/* global describe, it */

import expect from 'expect';

import {Injector, dependencies, provide} from '../src';

describe('Injector', function() {
    class Something {
        constructor(...args) {
            expect(args).toEqual([]);
            this.foo = 'bar';
        }
    }

    @dependencies({something: Something})
    class SomethingElse {
        constructor(...args) {
            expect(args.length).toBe(1);

            const [{something}] = args;

            this.something = something;
        }
    }

    @provide(Something)
    class Thing {
        constructor() {
            this.foo = 'baz';
        }
    }

    class Unrelated {
        constructor() {
            this.isUnrelated = true;
        }
    }

    it('should instantiate empty classes', function*() {
        const injector = new Injector();
        const something = yield injector.get(Something);

        expect(something).toBeA(Something);
        expect(something.foo).toBe('bar');
    });

    it('should instantiate classes with dependencies', function*() {
        const injector = new Injector();
        const somethingElse = yield injector.get(SomethingElse);

        expect(somethingElse).toBeA(SomethingElse);
        expect(somethingElse.something).toBeA(Something);

        const something = yield injector.get(Something);

        expect(something).toBe(somethingElse.something);
    });

    it('should format dependency lists', function*() {
        const injector = new Injector();
        const results = yield injector.get([Something, SomethingElse]);
        const something = yield injector.get(Something);
        const somethingElse = yield injector.get(SomethingElse);

        expect(results).toEqual([something, somethingElse]);
    });

    it('should use providers', function*() {
        const injector = new Injector([Thing]);
        const somethingElse = yield injector.get(SomethingElse);

        expect(somethingElse.something).toNotBeA(Something);
        expect(somethingElse.something).toBeA(Thing);
        expect(somethingElse.something.foo).toBe('baz');
    });

    it('should cache dependencies in the right ways', function*() {
        const injector = new Injector();
        const cinjector = injector.createChild([Thing]);

        const csomethingElse = yield cinjector.get(SomethingElse);

        expect(csomethingElse.something).toBeA(Thing);
        expect(csomethingElse.something.foo).toBe('baz');

        const somethingElse = yield injector.get(SomethingElse);

        expect(somethingElse.something).toBeA(Something);
        expect(somethingElse.something.foo).toBe('bar');

        const cunrelated = yield cinjector.get(Unrelated);
        const unrelated = yield injector.get(Unrelated);

        expect(cunrelated).toBe(unrelated);
    });
});
