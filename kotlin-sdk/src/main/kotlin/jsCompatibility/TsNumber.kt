package de.tutao.jsCompatibility

import kotlin.properties.Delegates

class TsNumber() : Number() {
	var value by Delegates.notNull<Double>()

	constructor(value: Number) : this() {
		this.value = value.toDouble()
	}

	override fun toDouble(): Double {
		return this.value
	}

	override fun toFloat(): Float {
		return this.value.toFloat()
	}

	override fun toLong(): Long {
		return this.value.toLong()
	}

	override fun toInt(): Int {
		return this.value.toInt()
	}

	override fun toShort(): Short {
		return this.value.toInt().toShort()
	}

	override fun toByte(): Byte {
		return this.value.toInt().toByte()
	}

	operator fun times(other: TsNumber): TsNumber {
		return TsNumber(this.value.times(other.value))
	}

	operator fun minus(other: TsNumber): TsNumber {
		return TsNumber(this.value.minus(other.value))
	}

	operator fun plus(other: TsNumber): TsNumber {
		return TsNumber(this.value.plus(other.value))
	}

	operator fun plus(other: Int): TsNumber {
		return TsNumber(this.value.plus(other))
	}

}