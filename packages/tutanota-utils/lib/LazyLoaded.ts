import type { lazyAsync } from "./Utils.js"

/**
 * A wrapper for an object that shall be lazy loaded asynchronously. If loading the object is triggered in parallel (getAsync()) the object is actually only loaded once but returned to all calls of getAsync().
 * If the object was loaded once it is not loaded again.
 */
export class LazyLoaded<T> {
	private state: { state: "not_loaded" } | { state: "loading"; promise: Promise<T> } | { state: "loaded"; value: T } = { state: "not_loaded" }

	/**
	 * @param loadFunction The function that actually loads the object as soon as getAsync() is called the first time.
	 * @param defaultValue The value that shall be returned by getSync() or getLoaded() as long as the object is not loaded yet.
	 */
	constructor(private readonly loadFunction: lazyAsync<T>, private defaultValue: T | null = null) {}

	load(): this {
		this.getAsync()
		return this
	}

	isLoaded(): boolean {
		return this.state.state === "loaded"
	}

	isLoadedOrLoading(): boolean {
		return this.state.state === "loaded" || this.state.state === "loading"
	}

	/**
	 * Loads the object if it is not loaded yet. May be called in parallel and takes care that the load function is only called once.
	 */
	getAsync(): Promise<T> {
		switch (this.state.state) {
			case "not_loaded":
				const loadingPromise = this.loadFunction().then(
					(value) => {
						this.state = { state: "loaded", value }
						return value
					},
					(e) => {
						this.state = { state: "not_loaded" }
						throw e
					},
				)
				this.state = { state: "loading", promise: loadingPromise }
				return loadingPromise
			case "loading":
				return this.state.promise
			case "loaded":
				return Promise.resolve(this.state.value)
		}
	}

	/**
	 * Returns null if the object is not loaded yet.
	 */
	getSync(): T | null {
		return this.state.state === "loaded" ? this.state.value : this.defaultValue
	}

	/**
	 * Only call this function if you know that the object is already loaded.
	 */
	getLoaded(): T {
		if (this.state.state === "loaded") {
			return this.state.value
		} else {
			throw new Error("Not loaded!")
		}
	}

	/**
	 * Removes the currently loaded object, so it will be loaded again with the next getAsync() call. Does not set any default value.
	 */
	reset() {
		this.state = { state: "not_loaded" }
		this.defaultValue = null
	}

	/**
	 * Loads the object again and replaces the current one
	 */
	async reload(): Promise<T> {
		this.state = { state: "not_loaded" }
		return this.getAsync()
	}
}
