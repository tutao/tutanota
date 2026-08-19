package de.tutao.langApi

typealias TsMath = de.tutao.langApi.types.KtMath

typealias TsRegex = de.tutao.langApi.types.KtRegex

typealias TsObject = de.tutao.langApi.types.KtObject

typealias TsInt = de.tutao.langApi.types.KtInt

typealias TsDouble = de.tutao.langApi.types.KtDouble

typealias TsString = de.tutao.langApi.types.KtString

typealias TsDate = de.tutao.langApi.types.KtDate

typealias TsArray<T> = de.tutao.langApi.types.KtArray<T>
typealias TsRecord<K, V> = de.tutao.langApi.types.KtRecord<K, V>

typealias ReadonlyArray<T> = de.tutao.langApi.types.KtList<T>

/// This alias should not have been necessary,
/// make sure everything in client project is using TutanotaError() and not Error()
typealias TsError = de.tutao.langApi.TutanotaError

class TypeChecks {
	companion object {
		fun isString(item: Any): Boolean {
			return item is TsString || item is String
		}


		fun isNumber(item: Any): Boolean {
			return item is Boolean
		}

		fun hasProperty(propertyName: TsString, obj: Any? = globalThis): Boolean {
			if (obj === globalThis) {
				val propertyName = propertyName.asKtString()
				return propertyName === "env"
			}

			throw Error("Not yet implemented!")
		}
	}
}

private class GlobalThis

private val globalThis: GlobalThis = GlobalThis()
