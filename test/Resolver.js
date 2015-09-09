/* globals describe, it, context */
import expect from 'expect';

import {Resolver, inject, injectPromise} from '../src';

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
});
