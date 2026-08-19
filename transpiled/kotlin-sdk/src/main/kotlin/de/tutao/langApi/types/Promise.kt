package de.tutao.langApi.types

import de.tutao.langApi.TutanotaError

class Promise<T> {
	fun await(): T {
		return null!!
	}

	fun <R> then(action: (item: T) -> R): Promise<R> {
		return null!!
	}

	fun <R> catch(action: (err: TutanotaError) -> R): Promise<R> {
		return null!!
	}
}