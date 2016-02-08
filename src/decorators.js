import React, {Component, PropTypes} from 'react';

import {DependencySet} from './dependency-set';
import {Provider} from './provider';
import {readDependencies} from './util';

/**
 * Decorates the target with a provider
 * for the given token.
 *
 * @param {function} token - The token you want to mock
 */
export function provide(token) {
    if (token == null) {
        throw new TypeError('@provide called with an undefined value');
    }

    return decorator;

    function decorator(target) {
        target.provider = new Provider(token, target);
    }
}

/**
 * Decorates the target with a dependency
 * declaration for for dependency set.
 *
 * @example
 * @dependencies(Foo, {bar: Bar, baz: Baz})
 * class Something {
 *     constructor(foo, obj) {
 *         assert(obj.bar instanceof Bar);
 *         assert(obj.baz instanceof Baz);
 * }
 * @param {...Object} tokens - The dependency set
 */
export function dependencies(...tokens) {
    const set = DependencySet.fromExpr(tokens);

    if (set.some(item => item == null)) {
        throw new TypeError('@dependencies called with an undefined token');
    }

    return decorator;

    function decorator(target) {
        target.dependencies = set;
    }
}

export function inject(depObj, children = []) {
    const depMap = DependencySet.fromExpr([depObj, ...children.map(toToken)]);

    return decorator;

    function decorator(OriginalComponent) {
        class InjectingDependency {
            constructor(props) {
                return props;
            }
        }

        InjectingDependency.dependencies = depMap;

        class InjectingContainerComponent extends Component {
            constructor(props, context) {
                super(props, context);

                const {dependencyCache} = this.context;

                if (!dependencyCache.has(InjectingDependency)) {
                    let original = OriginalComponent;

                    while (original.Original) {
                        original = original.Original;
                    }

                    throw new TypeError(`Injector dependency for ${original.name} not found`);
                }
            }

            render() {
                const {dependencyCache} = this.context;

                const depProps = dependencyCache.get(InjectingDependency);

                return (
                    <OriginalComponent {...this.props} {...depProps}/>
                );
            }
        }

        InjectingContainerComponent.dependencies = depMap;
        InjectingContainerComponent.Dependency = InjectingDependency;
        InjectingContainerComponent.Original = OriginalComponent;
        InjectingContainerComponent.displayName = `InjectingContainerComponent(${OriginalComponent.displayName || OriginalComponent.name})`;

        InjectingContainerComponent.contextTypes = {
            dependencyCache: PropTypes.instanceOf(Map).isRequired
        };

        return InjectingContainerComponent;
    }

    function toToken(child) {
        return child.Dependency || readDependencies(child);
    }
}
