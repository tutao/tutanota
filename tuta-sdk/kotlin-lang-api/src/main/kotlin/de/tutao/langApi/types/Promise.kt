package de.tutao.langApi.types

import de.tutao.langApi.TutanotaError
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async

@OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
class Promise<T> private constructor(private val task: Deferred<T>) {

	constructor(asyncFunc: suspend () -> Promise<T>) : this(GlobalScope.async { asyncFunc().await() })

	constructor(syncFunction: () -> T) : this(GlobalScope.async { syncFunction() })

	constructor(value: T) : this(GlobalScope.async { value })

	suspend fun await(): T {
		return task.await()
	}

	fun <P> then(asyncAction: suspend (T) -> Promise<P>): Promise<P> {
		return Promise(GlobalScope.async {
			val res = this@Promise.await()
			asyncAction(res).await()
		})
	}

	fun <P> then(syncAction: (T) -> P): Promise<P> {
		TODO("not implemented")
	}

	fun `catch`(action: suspend (TutanotaError) -> Promise<T>): Promise<T> {
		TODO("not implemented")
	}

	fun `catch`(action: (TutanotaError) -> T): Promise<T> {
		TODO("not implemented")
	}

	fun finally(action: suspend () -> Promise<Unit>): Promise<T> {
		return Promise(GlobalScope.async {
			val value: T
			try {
				value = this@Promise.await()
			} catch (e: Throwable) {
				action()
				throw e
			}

			action()
			value
		})
	}

	fun finally(action: () -> Unit): Promise<T> {
		return Promise(GlobalScope.async {
			val value: T
			try {
				value = this@Promise.await()
			} catch (e: Throwable) {
				action()
				throw e
			}

			action()
			value
		})
	}

	companion object {
		fun <T> resolve(value: T): Promise<T> {
			return Promise(value)
		}

		fun resolve(): Promise<Unit> {
			return resolve(Unit)
		}
	}
}
