package de.tutao.jsCompatibility

class TsString() {
	private lateinit var value: String

	constructor(v: String) : this() {
		this.value = v
	}


	override fun equals(other: Any?): Boolean {
		return this.value.equals(other)
	}

	override fun toString(): String {
		return this.value
	}

	fun replace(regex: Regex, replacement: TsString): TsString {
		return TsString(regex.replace(this.value, replacement.value))
	}

}