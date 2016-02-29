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

    it('should return itself when querying Injector', function*() {
        const injector = new Injector();

        const result = yield injector.get(Injector);

        expect(result).toBe(injector);
    });

    it('should not have this one complicated bug', function*() {
        @dependencies()
        class ThingA {}

        @provide(ThingA)
        class ThingAMock {}

        @dependencies()
        class ThingB {}

        @dependencies(ThingA, ThingB)
        class ThingC {
            constructor(a, b) {
                this.a = a;
                this.b = b;
            }
        }

        const injector = new Injector();

        const childInjector = injector.createChild([ThingAMock]);

        const provider = injector.getProviderFor(ThingB);
        const childProvider = childInjector.getProviderFor(ThingB);

        expect(provider).toBe(childProvider,
            'parent and child are returning different providers');

        const {parentResult, childResult} = yield {
            parentResult: injector.get(ThingB),
            childResult: childInjector.get(ThingB)
        };

        expect(parentResult).toBe(childResult, '?? what ??');
    });
});
