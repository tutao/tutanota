import { pMap as promiseMap } from "./PromiseMap.js";
/**
 * Map array of values to promise of arrays or array. Mapper function may return promise or value. If value is returned,
 * we avoid promise scheduling.
 *
 * This is needed to run the whole operation in one microtask (e.g. keep IndexedDB transaction active, which is closed in
 * some browsers (e.g. Safari) when event loop iteration ends).
 */
export function mapInCallContext(values, callback) {
    return new PromisableWrapper(_mapInCallContext(values, callback, 0, []));
}
function _mapInCallContext(values, callback, index, acc) {
    if (index >= values.length) {
        return acc;
    }
    let mappedValue = callback(values[index], index);
    if (mappedValue instanceof Promise) {
        return mappedValue.then((v) => {
            acc.push(v);
            return _mapInCallContext(values, callback, index + 1, acc);
        });
    }
    else {
        acc.push(mappedValue);
        return _mapInCallContext(values, callback, index + 1, acc);
    }
}
export { pMap as promiseMap } from "./PromiseMap.js";
function mapNoFallback(values, callback, options) {
    return PromisableWrapper.from(promiseMap(values, callback, options));
}
/** Factory function which gives you ack promiseMap implementation. {@see mapInCallContext} for what it means. */
export function promiseMapCompat(useMapInCallContext) {
    return useMapInCallContext ? mapInCallContext : mapNoFallback;
}
function flatWrapper(value) {
    return value instanceof PromisableWrapper ? value.value : value;
}
// It kinda implements 'thenable' protocol so you can freely pass it around as a generic promise
export class PromisableWrapper {
    static from(value) {
        return new PromisableWrapper(value);
    }
    value;
    constructor(value) {
        this.value = value instanceof Promise ? value.then(flatWrapper) : flatWrapper(value);
    }
    thenOrApply(onFulfill, onReject) {
        if (this.value instanceof Promise) {
            const v = this.value.then(onFulfill, onReject);
            return new PromisableWrapper(v);
        }
        else {
            try {
                return new PromisableWrapper(onFulfill(this.value));
            }
            catch (e) {
                if (onReject) {
                    return new PromisableWrapper(onReject(e));
                }
                throw e;
            }
        }
    }
    toPromise() {
        return Promise.resolve(this.value);
    }
}
export function delay(ms) {
    if (Number.isNaN(ms) || ms < 0) {
        throw new Error(`Invalid delay: ${ms}`);
    }
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
/**
 * Pass to Promise.then to perform an action while forwarding on the result
 * @param action
 */
export function tap(action) {
    return function (value) {
        action(value);
        return value;
    };
}
/**
 * Helper utility intended to be used with typed exceptions and .catch() method of promise like so:
 *
 * ```js
 *  class SpecificError extends Error {}
 *
 *  Promise.reject(new SpecificError())
 *      .catch(ofClass(SpecificError, (e) => console.log("some error", e)))
 *      .catch((e) => console.log("generic error", e))
 * ```
 *
 * @param cls Class which will be caught
 * @param catcher to handle only errors of type cls
 * @returns handler which either forwards to catcher or rethrows
 */
export function ofClass(cls, catcher) {
    return async (e) => {
        if (e instanceof cls) {
            return catcher(e);
        }
        else {
            // It's okay to rethrow because:
            // 1. It preserves the original stacktrace
            // 2. Because of 1. it is not that expensive
            throw e;
        }
    };
}
/**
 * Filter iterable. Just like Array.prototype.filter but callback can return promises
 */
export async function promiseFilter(iterable, filter) {
    let index = 0;
    const result = [];
    for (let item of iterable) {
        if (await filter(item, index)) {
            result.push(item);
        }
        index++;
    }
    return result;
}
/** Call the handler for both resolution and rejection. Unlike finally() will not propagate the error. */
export function settledThen(promise, handler) {
    return promise.then(handler, handler);
}
