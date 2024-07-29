import { lazyAsync, LazyLoaded } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"
import stream from "mithril/stream"

export class ObservableLazyLoaded<T> {
	private lazyLoaded: LazyLoaded<T>
	readonly stream: Stream<T> = stream()

	constructor(loadFunction: lazyAsync<T>, private readonly defaultValue: T) {
		this.lazyLoaded = new LazyLoaded<T>(async () => {
			const value = await loadFunction()
			this.stream(value)
			return value
		}, defaultValue)

		this.stream(defaultValue)
	}

	getAsync(): Promise<T> {
		return this.lazyLoaded.getAsync()
	}

	isLoaded(): boolean {
		return this.lazyLoaded.isLoaded()
	}

	getLoaded(): T {
		return this.lazyLoaded.getLoaded()
	}

	/** reset & reload the inner lazyLoaded without an observable default state unless loading fails */
	async reload(): Promise<T> {
		try {
			return await this.lazyLoaded.reload()
		} catch (e) {
			this.lazyLoaded.reset()
			this.stream(this.defaultValue)
			return this.defaultValue
		}
	}

	reset() {
		this.lazyLoaded.reset()
		this.stream(this.defaultValue)
	}
}
