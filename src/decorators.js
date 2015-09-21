import {Inject, InjectPromise, Provide, ProvidePromise, annotate} from 'di';
import lodash from 'lodash';

import {mergeTargets} from './util';

export function inject(...tokens) {
    const annotation = new Inject(...tokens);

    return decoratorFromAnnotation(annotation);
}

export function injectPromise(...tokens) {
    const annotation = new InjectPromise(...tokens);

    return decoratorFromAnnotation(annotation);
}

export function provide(...tokens) {
    const annotation = new Provide(...tokens);

    return decoratorFromAnnotation(annotation);
}

export function providePromise(...tokens) {
    const annotation = new ProvidePromise(...tokens);

    return decoratorFromAnnotation(annotation);
}

export function dependencies(depTable, children = []) {
    return decorator;

    function decorator(fn) {
        const deps = mergeTargets([{dependencies: depTable}, ...children]);

        fn.dependencies = deps;
    }
}

function decoratorFromAnnotation(annotation) {
    return annotator;

    function annotator(fn) {
        annotate(fn, annotation);
    }
}
