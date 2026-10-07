package de.tutao.langApi.types

class KtArray<T>(private vararg val inner: T) {
}

class KtList<T>(private val inner: List<T>) {
	companion object {
		fun <T> from(vararg items: T): KtList<T> {
			return null!!
		}

	}
}