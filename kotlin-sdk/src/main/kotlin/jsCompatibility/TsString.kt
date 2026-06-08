package de.tutao.jsCompatibility

class TsString() {
	private lateinit var value: String

	constructor(v: String) : this() {
		this.value = v
	}


	fun replace(regex: Regex, replacement: TsString) = TsString(regex.replace(this.value, replacement.value))

	operator fun plus(other: TsString) = TsString(this.value.plus(other.value))
	operator fun plus(other: String) = TsString(this.value.plus(other))
	override fun equals(other: Any?) = this.value.equals(other)
	override fun toString(): String = this.value
	override fun hashCode() = value.hashCode()


}