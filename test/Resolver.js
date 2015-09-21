/* globals describe, it, context */
import expect from 'expect';

import {Resolver, inject, injectPromise, dependencies} from '../src';

@injectPromise()
class TheGoods {
    constructor() {
        return new Promise(function(resolve, reject) {
            resolve({goods: 'are here'});
        });
    }
}

@inject(TheGoods)
class SomeOtherThing {
    constructor(theGoods) {
        this.theGoods = theGoods;
    }
}

@inject()
class SomethingUnrelated {
    isUnrelated() {
        return true;
    }
}

@dependencies({
    someOtherThing: SomeOtherThing
})
class SomeTarget {}

describe('Resolver', function() {
    it('works?', function*() {
        const resolver = new Resolver({
            somethingUnrelated: SomethingUnrelated,
            someOtherThing: SomeOtherThing
        });

        const results = yield resolver.resolve();

        const {someOtherThing, somethingUnrelated} = results;

        expect(someOtherThing.theGoods.goods).toBe('are here');
        expect(somethingUnrelated.isUnrelated()).toBe(true);
    });

    it('works with @dependencies', function*() {
        const resolver = Resolver.from([SomeTarget]);

        const results = yield resolver.resolve();

        expect(results.somethingUnrelated).toBe(undefined);
        expect(results.someOtherThing.theGoods.goods).toBe('are here');
    });
});
