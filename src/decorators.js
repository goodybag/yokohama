import React, {Component, PropTypes} from 'react';

import {DependencySet} from './dependency-set';
import {Provider} from './provider';
import {readDependencies} from './util';

export function provide(token) {
    if (token == null) {
        throw new TypeError('@provide called with an undefined value');
    }

    return decorator;

    function decorator(target) {
        target.provider = new Provider(token, target);
    }
}

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
            static dependencies = depMap;

            constructor(props) {
                return props;
            }
        }

        class InjectingContainerComponent extends Component {
            static dependencies = depMap;
            static Dependency = InjectingDependency;
            static Original = Component;

            static contextTypes = {
                dependencyCache: PropTypes.instanceOf(Map).isRequired
            }

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

        return InjectingContainerComponent;
    }

    function toToken(child) {
        return child.Dependency || readDependencies(child);
    }
}
