package de.tutao.langApi.types

class KtString(private val inner: String) {
	companion object {
		fun fromCharCode(vararg nums: KtInt): KtString {
			TODO()
		}

		fun fromCodePoint(vararg nums: KtInt): KtString {
			TODO()
		}
	}

	var length: KtInt = KtInt(inner.length)

	fun asPrimitive(): String {
		return this.inner
	}

	fun asString(): KtString {
		return this
	}

	fun at(index: KtInt): KtString? {
		TODO()
	}

	fun charAt(index: KtInt): KtString {
		TODO()
	}

	fun charCodeAt(index: KtInt): KtDouble {
		TODO()
	}

	fun codePointAt(index: KtInt): KtInt? {
		TODO()
	}

	fun concat(vararg str: KtString): KtString {
		TODO()
	}

	fun endsWith(searchString: KtString, endPosition: KtInt? = null): Boolean {
		TODO()
	}

	fun includes(searchString: KtString, position: KtInt = KtInt(0)): Boolean {
		TODO()
	}

	fun indexOf(searchString: KtString, position: KtInt = KtInt(0)): KtInt {
		TODO()
	}

	fun isWellFormed(): Boolean {
		TODO()
	}

	fun lastIndexOf(searchString: KtString, position: KtInt = KtInt(0)): KtInt {
		TODO()
	}

	fun match(other: KtRegExp): KtString? {
		TODO()
	}

	fun padStart(targetLength: KtInt, padString: KtString = KtString(" ")): KtString {
		TODO()
	}

	fun repeat(count: KtInt): KtString {
		TODO()
	}

	fun replace(pattern: KtRegExp, replacement: KtString): KtString {
		TODO()
	}

	fun replace(pattern: KtString, replacement: KtString): KtString {
		TODO()
	}

	fun replaceAll(pattern: KtRegExp, replacement: KtString): KtString {
		TODO()
	}

	fun replaceAll(pattern: KtString, replacement: KtString): KtString {
		TODO()
	}

	fun slice(indexStart: KtInt, indexEnd: KtInt? = null): KtString {
		TODO()
	}

	fun split(separator: KtString, limit: KtInt = KtInt(-1)): KtArray<KtString> {
		TODO()
	}

	fun startsWith(substring: KtString): Boolean {
		TODO()
	}

	fun substring(indexStart: KtInt, indexEnd: KtInt? = null): KtString {
		TODO()
	}

	fun toLowerCase(): KtString {
		TODO()
	}

	// toString() clashes with Any.toString() which returns kotlin.String
	fun toString_notTheKeyword(): KtString {
		TODO()
	}

	fun toUpperCase(): KtString {
		TODO()
	}

	fun toWellFormed(): KtString {
		TODO()
	}

	fun trim(): KtString {
		TODO()
	}

	fun trimEnd(): KtString {
		TODO()
	}

	fun trimStart(): KtString {
		TODO()
	}

	operator fun plus(other: KtString): KtString {
		return KtString(this.inner.plus(other.inner))
	}
}
