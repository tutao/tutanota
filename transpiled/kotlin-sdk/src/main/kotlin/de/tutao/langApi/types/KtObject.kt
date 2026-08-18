package de.tutao.langApi.types

class KtObject {
	companion object {
		fun <T> freeze(list: List<T>): List<T> {
			return list.toList()
		}

		fun <T> freeze(list: Array<T>): List<T> {
			return list.toList()
		}
	}
}
