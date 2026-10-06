package de.tutao.langApi;

typealias TsMath = de.tutao.langApi.types.KtMath
typealias TsRegex = de.tutao.langApi.types.KtRegex
typealias TsObject = de.tutao.langApi.types.KtObject
typealias TsNumber = de.tutao.langApi.types.KtNumber
typealias TsString = de.tutao.langApi.types.KtString
typealias TsDate = de.tutao.langApi.types.KtDate

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


