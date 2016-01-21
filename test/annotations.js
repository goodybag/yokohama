/* global describe, it */

import expect from 'expect';

import {makeAnnotation} from '../src/annotations';

describe('makeAnnotation', function() {
    class Something {}

    class SomethingElse {}

    it('should work', function*() {
        const someAnnotation = makeAnnotation('MyAnnotation');

        expect(someAnnotation(Something)).toBe(someAnnotation(Something));
        expect(someAnnotation(Something)).toNotBe(someAnnotation(SomethingElse));
        expect(someAnnotation(SomethingElse).name).toBe('MyAnnotation(SomethingElse)');
    });
});
