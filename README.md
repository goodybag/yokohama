yokohama [![Build Status][build-badge]][build-link] [![NPM Version][version-badge]][version-link] [![License][license-badge]][license-link]
========

Yokohama is a dependency resolution library inspired by [di.js][] and
[Relay][]. It uses ES7 decorators for annotating dependencies and supports
injecting with React.

Usage
-----

Yokohama is a stand-alone library and doesn't use global singleton modules for
tracking dependency instances. Instead, dependency constructors declare their
dependencies by referencing the constructors of other dependencies, which can
be crawled like a tree to access the constructors for every dependency in the
system. This avoids the need for shared injector instances as well as avoiding
the use of strings for identifying dependencies.

To use yokohama, you can use [`@dependencies`][dependencies] and
[`@inject`][inject] to start plugging together dependencies in your system.
Dependencies are instantiated, but they can return any non-null values.
Yokohama is built around asynchronous intialization, any dependency can return
a promise and it will be factored in and properly parallelized.

### `@dependencies`

`@dependencies` is used to list all dependencies of the target. The shape of
the arguments passed to the call become the same shape when passed to the
constructor.

```js
@dependencies({foo: Foo}, Bar, [Baz, Quux])
class Something {
    // The tokens map 1:1 with the arguments passed to the constructor
    constructor({foo}, bar, [baz, quux]) {
        // ...
    }
}
```

### `@inject`

`@inject` is similar to `@dependencies` but is used for creating a wrapper for
React components that inject dependencies by passing them through props.
`@inject` assumes you have provided the dependency cache in the context. All
props passed to this wrapper component are forwarded to the original component.

```js
@inject({
    foo: Foo,
    baz: Baz
})
class SomeComponent extends React.Component {
    static propTypes = {
        foo: React.PropTypes.instanceOf(Foo).isRequired,
        baz: React.PropTypes.instanceOf(Bar).isRequired
    };

    // ...
}
```

### `@provide`

One of the core features of yokohama is the ability to provide mock
implementations to customize the dependency tree under certain contexts.
`@provide` is used to annotate that a specific constructor is a "mock" that
will replace the constructor of whatever token is passed to `@provide`. The
mock constructor can then inject it's own dependencies.

This is really useful for treating dependency tokens as interfaces, where the
implementation is specified in the entrypoint instead of being hard-coded into
whatever module it is declared. This allows for inverting the dependency tree
and writing clean, isolated and maintainable modules.

```js
class CurrentUser {}

@provide(CurrentUser)
class ClientCurrentUser {
    constructor() {
        return fetch('/users/me').then(res => res.json());
    }
}

@provide(CurrentUser)
@dependencies(http.IncomingRequest)
class ServerCurrentUser {
    constructor(req) {
        return req.user;
    }
}

// in the server entry point
const injector = new Injector([ServerCurrentUser]);

// in the client entry point
const injector = new Injector([ClientCurrentUser]);
```

### `new Injector([mocks])`

The injector instance is where instances of depenencies get cached. It's also
where you specify what mocks to use. If you use the same injector instance more
than once, it will re-use cached instances of dependencies from the previous
load. You can leverage this by creating a shared injector instance and creating
child injectors where temporary instances will be cached. That means the
temporary instances are discarded when the child is discarded, but the
permanent/shared instances will stay cached in the parent.

### `Injector#createChild([mocks])`

This, along with the mock system itself, is where yokohama is very powerful.
Only dependencies that depend on the child's mocks will be cached in the child
injector. This means any other dependencies will be cached in the parent
injector instead.

For example, you can create a shared injector for
initializing HTTP controllers, but create a child injector with mocks for the
HTTP request and response objects. If the request and response dependencies are
mocked in the child injector, then anything that depends on those will be
cached in the child injector, and will only live for the duration of the
request. So resources that are initialized per-request would stay in the child,
but shared resources like the server configuration would stay cached in the
parent and shared across all requests.

You could go even further by caching connection pools in the parent injector,
and having a mock for the "database connection" in the children that would
query from the pool on every request. This would also ensure that connections
are established on an as-needed basis, instead of wastefully connecting for
*every* request made. There's even more you could with mocks and child
injectors that would allow you control the order of instantiation to further
optimize and avoid unecessary connections or queries.

Example
-------

```js
class User {
    constructor(attrs) {
        const {id, name, email} = attrs;

        this.id = id;
        this.name = name;
        this.email = email;
    }
}

class CurrentUser {}

@provide(CurrentUser)
class CurrentUserResolver {
    constructor() {
        return fetch('/users/me')
            .then(res => res.json())
            .then(body => new User(body));
    }
}

@dependencies(Dispatcher, CurrentUser)
class CurrentUserStore extends Store {
    constructor(dispatcher, currentUser) {
        // ...
    }
}

@inject({
    dispatcher: Dispatcher,
    currentUser: CurrentUser
})
class HelloComponent extends React.Component {
    render() {
        const {currentUser} = this.props;

        return (
            <div>Hello {currentUser.name}!</div>
        );
    }
}
```

Documentation
-------------

Detailed API documentation can be found in the JSDoc annotations and TypeScript
definitions in `src/`. Otherwise see the [Usage][] section of this README

Pending features
----------------

See [all open feature issues][feature-issues]

[build-badge]: http://img.shields.io/travis/goodybag/yokohama.svg?style=flat
[build-link]: https://travis-ci.org/goodybag/yokohama
[version-badge]: http://img.shields.io/npm/v/yokohama.svg?style=flat
[version-link]: https://npmjs.org/package/yokohama
[license-badge]: http://img.shields.io/npm/l/yokohama.svg?style=flat
[license-link]: https://github.com/goodybag/yokohama/blob/master/LICENSE
[di.js]: https://github.com/angular/di.js
[relay]: https://github.com/facebook/relay
[usage]: #usage
[feature-issues]: https://github.com/goodybag/yokohama/issues?q=is:issue+is:open+label:feature
[dependencies]: #dependencies
[inject]: #inject
