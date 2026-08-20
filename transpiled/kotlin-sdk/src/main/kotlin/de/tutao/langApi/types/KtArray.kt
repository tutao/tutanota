package de.tutao.langApi.types

class KtArray<T>(private val inner: Array<T>) {
}

class KtList<T>(private val inner: List<T>) {
	companion object {
		fun <T> from(vararg items: T): KtList<T> {
			return null!!
		}

	}
}