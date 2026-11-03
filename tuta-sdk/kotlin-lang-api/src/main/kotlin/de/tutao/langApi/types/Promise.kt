package de.tutao.langApi.types

import de.tutao.langApi.TutanotaError

class Promise<T> {
	companion object {
		fun <T> resolve(value: T): Promise<T> {
			return null!!
		}

		fun <T> resolve(promise: Promise<T>): Promise<T> {
			return promise
		}
	}

	fun await(): T {
		return null!!
	}

	fun <R> then(action: (item: T) -> R): Promise<R> {
		return null!!
	}

	fun <R> catch(action: (err: TutanotaError) -> R): Promise<R> {
		return null!!
	}

	fun finally(action: () -> Unit): Promise<T> {
		return null!!
	}


}