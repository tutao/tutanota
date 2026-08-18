package de.tutao.langApi.types

import de.tutao.langApi.TsNumber
import de.tutao.langApi.TsRegex
import de.tutao.langApi.TsString

class KtString(val inner: String) {
	var length: KtInt = KtInt(inner.length)

	fun indexOf(hay: KtString, from: TsNumber = TsNumber(0)): KtInt {
		// FIXME: implement
		return KtInt(0)
	}

	fun asKtString(): String {
		return this.inner
	}

	fun substring(f: Any, s: Any? = null): TsString {
		return null!!
	}


	fun match(other: TsRegex): TsString? {
		return null
	}

	fun charAt(loc: TsNumber): TsNumber {
		return null!!
	}

	fun replace(f: TsRegex, r: TsString): TsString {
		return this
	}
}
