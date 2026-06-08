package de.tutao.jsCompatibility

import kotlin.properties.Delegates

class TsNumber() : Number() {
	var value by Delegates.notNull<Double>()

	companion object {
		fun isNaN(toCheck: TsNumber) = toCheck.value.isNaN()
		fun parseInt(str: TsString) = Integer.parseInt(str.toString())
	}

	constructor(value: Number) : this() {
		this.value = value.toDouble()
	}

	override fun toDouble() = this.value
	override fun toFloat() = this.value.toFloat()
	override fun toLong() = this.value.toLong()
	override fun toInt() = this.value.toInt()
	override fun toShort() = this.value.toInt().toShort()
	override fun toByte() = this.value.toInt().toByte()

	operator fun compareTo(other: TsNumber) = this.value.compareTo(other.value)
	operator fun compareTo(other: Number) = this.value.compareTo(other.toDouble())

	operator fun times(other: TsNumber) = TsNumber(this.value.times(other.value))
	operator fun minus(other: TsNumber) = TsNumber(this.value.minus(other.value))
	operator fun plus(other: TsNumber) = TsNumber(this.value.plus(other.value))
	operator fun plus(other: Int) = TsNumber(this.value.plus(other))
	operator fun inc() = TsNumber(++this.value)
	operator fun dec() = TsNumber(--this.value)
}

fun isNaN(toCheck: TsNumber) = TsNumber.isNaN(toCheck)