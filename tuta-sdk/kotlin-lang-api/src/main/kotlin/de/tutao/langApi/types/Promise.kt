package de.tutao.langApi.types

import de.tutao.langApi.TutanotaError
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async as coroutineAsync

/**
 * A JS-like promise, backed by a [Deferred].
 *
 * The body of a transpiled async function runs inside [Promise.async] (`return Promise.async { ... }`),
 * and `await p` is transpiled to `p.await()`, which suspends.
 */
class Promise<T> private constructor(private val deferred: Deferred<T>) {
	companion object {
		// a failing promise must not cancel the other ones, hence the SupervisorJob
		private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

		/**
		 * Runs [block] as the body of an async function. Like in JS, the body starts immediately on the
		 * caller's thread and only leaves it at the first suspension point (the first `await()`).
		 * An exception thrown by [block] rejects the promise and is rethrown by [await].
		 */
		fun <T> async(block: suspend () -> T): Promise<T> {
			return Promise(scope.coroutineAsync(start = CoroutineStart.UNDISPATCHED) { block() })
		}

		fun resolve(): Promise<Unit> {
			return resolve(Unit)
		}

		fun <T> resolve(value: T): Promise<T> {
			return Promise(CompletableDeferred(value))
		}

		fun <T> resolve(promise: Promise<T>): Promise<T> {
			return promise
		}
	}

	suspend fun await(): T {
		return deferred.await()
	}

	fun <R> then(action: (item: T) -> R): Promise<R> {
		return async { action(await()) }
	}

	fun <R> catch(action: (err: TutanotaError) -> R): Promise<R> {
		return null!!
	}

	fun finally(action: () -> Unit): Promise<T> {
		return async {
			try {
				await()
			} finally {
				action()
			}
		}
	}
}
