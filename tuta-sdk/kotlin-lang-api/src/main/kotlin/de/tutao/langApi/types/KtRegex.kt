package de.tutao.langApi.types

import de.tutao.langApi.TsString

class KtRegex(val regex: String, val flags: String = "") {
	constructor(pattern: KtString, flags: KtString = KtString("")) : this(pattern.asPrimitive(), flags.asPrimitive())

	val source: KtString
		get() = TODO()
	val hasIndices: Boolean
		get() = TODO()
	val global: Boolean
		get() = TODO()
	val ignoreCase: Boolean
		get() = TODO()
	val multiline: Boolean
		get() = TODO()
	val dotAll: Boolean
		get() = TODO()
	val unicode: Boolean
		get() = TODO()
	val unicodeSets: Boolean
		get() = TODO()
	val sticky: Boolean
		get() = TODO()

	// toString() clashes with Any.toString() which returns kotlin.String
	fun toString_notTheKeyword(): KtString {
		TODO()
	}

	fun test(item: TsString): Boolean {
		TODO()
	}

	companion object {
		fun escape(string: KtString): KtString {
			TODO()
		}
	}
}
