/**
 * Factory method to allow tracing unresolved promises.
 */
export function newPromise<T>(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void, tag?: string): Promise<T> {
	const promise = new Promise<T>((resolve, reject) => {
		executor(resolve, reject)
	})

	// only to be enabled for local debugging purposes
	// 	traceUnresolvedPromises(promise, tag)

	return promise
}
