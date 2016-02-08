/**
 * Used for making idempotent anotation functions
 * that can be used for *tagging* resources.
 *
 * @example
 * const Collection = makeAnnotation('Collection');
 *
 * assert(Collection(Bar) === Collection(Bar));
 * assert(Collection(Foo) !== Collection(Bar));
 * @param {string} [name=Annotation] - Name of the annotation
 * @returns {function}
 */
export function makeAnnotation(name = 'Annotation') {
    const cache = new WeakMap();

    return annotate;

    function annotate(token) {
        if (token == null) {
            throw new TypeError('Cannot annotate undefined token');
        } else if (cache.has(token)) {
            return cache.get(token);
        } else {
            const annotatedToken = makeAnnotatedToken(token);

            cache.set(token, annotatedToken);

            return annotatedToken;
        }
    }

    function makeAnnotatedToken(token) {
        class AnnotatedDependency {}

        try {
            Object.defineProperty(AnnotatedDependency, 'name', {
                value: `${name}(${token.name})`
            });
        } catch (err) {}

        return AnnotatedDependency;
    }
}
