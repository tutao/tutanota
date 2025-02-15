/**
 * Represents a resource that is either not ready, ready, or error
 * Sort of fills a similar role to LazyLoaded, usage is more verbose but also more typesafe. maybe this should be reconciled.
 */
export class AsyncResult {
    _state;
    constructor(promise) {
        this._state = pending(promise);
        promise.then((result) => (this._state = complete(result))).catch((error) => (this._state = failure(error)));
    }
    state() {
        return this._state;
    }
}
function pending(promise) {
    return {
        status: "pending",
        promise,
    };
}
function complete(result) {
    return {
        status: "complete",
        result,
    };
}
function failure(error) {
    return {
        status: "failure",
        error,
    };
}
