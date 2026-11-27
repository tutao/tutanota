package de.tutao.langApi.types

class KtString(private val inner: String) {
	companion object {
		fun fromCharCode(vararg nums: KtNumber): KtString {
			TODO()
		}

		fun fromCodePoint(vararg nums: KtNumber): KtString {
			TODO()
		}
	}

	var length: KtNumber = KtNumber(inner.length)

	fun asPrimitive(): String {
		return this.inner
	}

	fun asString(): KtString {
		return this
	}

	fun at(index: KtNumber): KtString? {
		TODO()
	}

	fun charAt(index: KtNumber): KtString {
		TODO()
	}

	fun charCodeAt(index: KtNumber): KtNumber {
		TODO()
	}

	fun codePointAt(index: KtNumber): KtNumber? {
		TODO()
	}

	fun concat(vararg str: KtString): KtString {
		TODO()
	}

	fun endsWith(searchString: KtString, endPosition: KtNumber? = null): Boolean {
		TODO()
	}

	fun includes(searchString: KtString, position: KtNumber = KtNumber(0)): Boolean {
		TODO()
	}

	fun indexOf(searchString: KtString, position: KtNumber = KtNumber(0)): KtNumber {
		TODO()
	}

	fun isWellFormed(): Boolean {
		TODO()
	}

	fun lastIndexOf(searchString: KtString, position: KtNumber = KtNumber(0)): KtNumber {
		TODO()
	}

	fun match(other: KtRegExp): KtString? {
		TODO()
	}

	fun padStart(targetLength: KtNumber, padString: KtString = KtString(" ")): KtString {
		TODO()
	}

	fun repeat(count: KtNumber): KtString {
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

	fun slice(indexStart: KtNumber, indexEnd: KtNumber? = null): KtString {
		TODO()
	}

	fun split(separator: KtString, limit: KtNumber = KtNumber(-1)): KtArray<KtString> {
		TODO()
	}

	fun startsWith(substring: KtString): Boolean {
		TODO()
	}

	fun substring(indexStart: KtNumber, indexEnd: KtNumber? = null): KtString {
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
