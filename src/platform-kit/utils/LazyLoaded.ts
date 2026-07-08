import type { lazyAsync } from "./Utils.js"

enum LoadState {
	NotLoaded,
	Loading,
	Loaded,
}

/**
 * A wrapper for an object that shall be lazy loaded asynchronously. If loading the object is triggered in parallel (getAsync()) the object is actually only loaded once but returned to all calls of getAsync().
 * If the object was loaded once it is not loaded again.
 */

export class LazyLoaded<T> {
	private state = LoadState.NotLoaded
	private promise: Promise<T> | null = null
	private value: T | null = null

	/**
	 * @param loadFunction The function that actually loads the object as soon as getAsync() is called the first time.
	 * @param defaultValue The value that shall be returned by getSync() or getLoaded() as long as the object is not loaded yet.
	 */
	constructor(
		private readonly loadFunction: lazyAsync<T>,
		private defaultValue: T | null = null,
	) {}

	/**
	 * Returns a LazyLoaded object that has already been loaded and can be retrieved with getSync()
	 */
	static newLoaded<T>(object: T): LazyLoaded<T> {
		const loaded = new LazyLoaded(async () => object)
		loaded.state = LoadState.Loaded
		loaded.value = object
		return loaded
	}

	load(): this {
		this.getAsync()
		return this
	}

	isLoaded(): boolean {
		return this.state === LoadState.Loaded
	}

	isLoadedOrLoading(): boolean {
		return this.state === LoadState.Loaded || this.state === LoadState.Loading
	}

	/**
	 * Loads the object if it is not loaded yet. May be called in parallel and takes care that the load function is only called once.
	 */
	getAsync(): Promise<T> {
		switch (this.state) {
			case LoadState.NotLoaded: {
				const loadingPromise = this.loadFunction().then(
					(value) => {
						this.state = LoadState.Loaded
						this.value = value
						return value
					},
					(e) => {
						this.state = LoadState.NotLoaded
						throw e
					},
				)
				this.state = LoadState.Loading
				this.promise = loadingPromise
				return loadingPromise
			}
			case LoadState.Loading:
				return this.promise!
			case LoadState.Loaded:
				return Promise.resolve(this.value!)
		}
	}

	/**
	 * Returns null if the object is not loaded yet.
	 */
	getSync(): T | null {
		return this.state === LoadState.Loaded ? this.value : this.defaultValue
	}

	/**
	 * Only call this function if you know that the object is already loaded.
	 */
	getLoaded(): T {
		if (this.state === LoadState.Loaded) {
			return this.value!
		} else {
			throw new Error("Not loaded!")
		}
	}

	/**
	 * Removes the currently loaded object, so it will be loaded again with the next getAsync() call. Does not set any default value.
	 */
	reset() {
		this.state = LoadState.NotLoaded
		this.defaultValue = null
	}

	/**
	 * Loads the object again and replaces the current one
	 */
	async reload(): Promise<T> {
		this.state = LoadState.NotLoaded
		return this.getAsync()
	}
}
