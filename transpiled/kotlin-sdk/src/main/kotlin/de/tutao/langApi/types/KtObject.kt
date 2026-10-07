package de.tutao.langApi.types

import de.tutao.langApi.TsList

class KtObject {
	companion object {
		fun <T> freeze(item: T): T {
			return item
		}

		fun <T> freeze(list: List<T>): List<T> {
			return list.toList()
		}

		fun <T> freeze(list: Array<T>): Array<T> {
			return list
		}

		fun <T> freeze(list: TsList<T>): TsList<T> {
			return list
		}

		fun <T> freeze(list: KtArray<T>): TsList<T> {
			return list as TsList<T>
		}

	}
}
