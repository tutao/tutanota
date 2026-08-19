package de.tutao.langApi.types


class KtString(val inner: String) {
	var length: KtInt = KtInt(inner.length)

	fun indexOf(hay: KtString, from: KtInt = KtInt(0)): KtInt {
		// FIXME: implement
		return KtInt(0)
	}

	fun asKtString(): String {
		return this.inner
	}

	fun substring(f: Any, s: Any? = null): KtString {
		return null!!
	}

	fun match(other: KtRegex): KtString? {
		return null
	}

	fun charAt(loc: KtInt): KtInt {
		return null!!
	}

	fun replace(f: KtRegex, r: KtString): KtString {
		return this
	}
}
