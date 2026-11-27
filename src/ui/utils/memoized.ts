import { arrayEquals, deepEqual } from "@tutao/utils"

/**
 * Returns a cached version of {@param fn}.
 * Cached function checks that argument is the same (with ===) and if it is then it returns the cached result.
 * If the cached argument has changed then {@param fn} will be called with new argument and result will be cached again.
 * Only remembers the last argument.
 */
export function memoized<F extends (...args: any[]) => any>(fn: F): F {
	let lastArgs: unknown[]
	let lastResult: Parameters<F>
	let didCache = false

	const memoizedFunction = (...args: Parameters<F>) => {
		if (!didCache || !arrayEquals(lastArgs, args)) {
			lastArgs = args
			didCache = true
			lastResult = fn(...args)
		}

		return lastResult
	}
	return memoizedFunction as F
}

/**
 * Returns a cached version of {@param fn}.
 * Cached function checks that argument is deeply the same and if it is then it returns the cached result.
 * If the cached argument has changed then {@param fn} will be called with new argument and result will be cached again.
 * Only remembers the last argument.
 */
export function deepMemoized<F extends (...args: any[]) => any>(fn: F): F {
	let lastArgs: unknown[]
	let lastResult: Parameters<F>
	let didCache = false

	const memoizedFunction = (...args: Parameters<F>) => {
		if (!didCache || !deepEqual(lastArgs, args)) {
			lastArgs = args
			didCache = true
			lastResult = fn(...args)
		}

		return lastResult
	}
	return memoizedFunction as F
}

/**
 * Like {@link memoized} but the argument is passed in via {@param argumentProvider}.
 * Useful for the cases where we want to keep only one field around e.g. for lazy getters
 */
export function memoizedWithHiddenArgument<T, R>(argumentProvider: () => T, computationFunction: (arg: T) => R): () => R {
	const memoizedComputation = memoized(computationFunction)
	return () => memoizedComputation(argumentProvider())
}
