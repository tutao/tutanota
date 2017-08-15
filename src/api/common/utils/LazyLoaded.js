// @flow
import {neverNull} from "./Utils"

/**
 * A wrapper for an object that shall be lazy loaded asynchronously. If loading the object is triggered in parallel (getAsync()) the object is actually only loaded once but returned to all calls of getAsync().
 * If the object was loaded once it is not loaded again.
 */
export class LazyLoaded<T> {

	_loadingPromise: ?Promise<T>; // null if loading is not started yet
	_loadedObject: ?T;
	_loadFunction: lazyAsync<T>;

	/**
	 * @param loadFunction The function that actually loads the object as soon as getAsync() is called the first time.
	 * @param defaultValue The value that shall be returned by getSync() or getLoaded() as long as the object is not loaded yet.
	 */
	constructor(loadFunction: lazyAsync<T>, defaultValue: ?T) {
		this._loadFunction = loadFunction
		this._loadingPromise = null
		this._loadedObject = defaultValue
	}

	isLoaded() {
		return this._loadingPromise && this._loadingPromise.isFulfilled()
	}

	/**
	 * Loads the object if it is not loaded yet. May be called in parallel and takes care that the load function is only called once.
	 */
	getAsync(): Promise<T> {
		if (this.isLoaded()) {
			return Promise.resolve(neverNull(this._loadedObject))
		} else {
			if (!this._loadingPromise) {
				this._loadingPromise = this._loadFunction().then(result => {
					this._loadedObject = result
					return result
				})
			}
			return this._loadingPromise
		}
	}

	/**
	 * Returns null if the object is not loaded yet.
	 */
	getSync(): ?T {
		return this._loadedObject
	}

	/**
	 * Only call this function if you know that the object is already loaded.
	 */
	getLoaded(): T {
		return neverNull(this._loadedObject)
	}

	/**
	 * Removes the currently loaded object, so it will be loaded again with the next getAsync() call. Does not set any default value.
	 */
	reset() {
		this._loadingPromise = null
		this._loadedObject = null
	}
}