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

		fun <T> freeze(list: KtArray<T>): TsList<T> {
			return list as TsList<T>
		}

		fun <T> keys(obj: T): KtArray<KtString> {
			TODO()
		}
	}
}

class KtJson {
	companion object {
		fun <T> stringify(obj: T): KtString {
			TODO()
		}

		fun <T> parse(jsonString: KtString): T {
			TODO()
		}
	}
}
