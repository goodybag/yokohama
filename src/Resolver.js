import lodash from 'lodash';
import {provide, inject} from './decorators';
import {Injector} from 'di';

export class Resolver {
    constructor(depTable, injector = new Injector()) {
        this.dependencies = lodash.map(depTable,
                                       (token, name) => ({token, name}));
        this.injector = injector;
    }

    resolve() {
        const finalizer = this.makeFinalizer();

        return this.injector
            .getPromise(finalizer)
            .then(values => this.shapeResults(values));
    }

    makeFinalizer() {
        const tokens = lodash.pluck(this.dependencies, 'token');

        @inject(...tokens)
        class Finalizer {
            constructor(...args) {
                return args;
            }
        }

        return Finalizer;
    }

    shapeResults(values) {
        const {dependencies} = this;
        const results = {};

        lodash.each(values, (value, index) => {
            let {name} = dependencies[index];

            results[name] = value;
        });

        return results;
    }

    getResolvers() {
        return lodash.pluck(this.dependencies, 'resolver');
    }
}

function toDependency(token, name) {
    return {name, token};
}

function toDependencies(depTable) {
    return lodash.map(depTable, toDependency);
}
