package de.tutao.langApi.types


class KtString(private val inner: String) {
	var length: KtInt = KtInt(inner.length)

	fun indexOf(hay: KtString, from: KtInt = KtInt(0)): KtInt {
		// FIXME: implement
		return KtInt(0)
	}

	fun asPrimitive(): String {
		return this.inner
	}

	fun asString(): KtString {
		return this
	}

	fun substring(f: Any, s: Any? = null): KtString {
		return null!!
	}

	fun match(other: KtRegex): KtString? {
		return null
	}

	fun charAt(loc: KtInt): KtString {
		return null!!
	}

	fun replace(f: KtRegex, r: KtString): KtString {
		return this
	}

	operator fun plus(other: KtString): KtString {
		return KtString(this.inner.plus(other.inner))
	}
}
