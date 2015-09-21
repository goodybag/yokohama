yokohama [![Build Status](http://img.shields.io/travis/goodybag/yokohama.svg?style=flat)](https://travis-ci.org/goodybag/yokohama) [![NPM Version](http://img.shields.io/npm/v/yokohama.svg?style=flat)](https://npmjs.org/package/yokohama) [![License](http://img.shields.io/npm/l/yokohama.svg?style=flat)](https://github.com/goodybag/yokohama/blob/master/LICENSE)
=========

Yokohama is a dependency resolution library inspired by
[di.js](https://github.com/angular/di.js) and
[Relay](https://github.com/facebook/relay). It is designed with ES6-support
in mind. For now, it piggy-backs on the di.js's implementation.

Usage
-----

```js
import {inject, dependencies, Resolver} from 'yokohama';

class SomeResource {}

@injectPromise()
function ResolveSomeResource() {
    return Promise.resolve(new SomeResource(...));
}

@inject(ResolveSomeResource)
class SomeOtherResource {
    constructor(someResource) {
        // ...
    }
}

@dependencies({
    someResource: SomeResource,
    someOtherResource: SomeOtherResource
}, [SomeChildComponent, /* ... */])
class SomeComponent {
    // ...
}

const resolver = Resolver.from(SomeComponent);
// alternatively:
// new Resolver({
    someResource: SomeResource,
    someOtherResource: SomeOtherResource
// });

resolver.resolve().then(function(table) {
    table.someResource instanceof SomeResource; // true
    table.someOtherResource instanceof SomeOtherResource; // true
});
```

Documentation
-------------

TODO
