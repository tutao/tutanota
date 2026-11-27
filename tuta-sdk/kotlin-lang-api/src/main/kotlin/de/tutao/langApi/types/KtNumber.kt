package de.tutao.langApi.types

final class KtNumber(private val inner: Double) {
	companion object {
		fun fromFloat(float: Float): KtNumber {
			return null!!
		}

		fun parseInt(str: KtString): KtNumber {
			return null!!
		}

		fun isNaN(num: KtNumber): Boolean {
			return false
		}

		fun toString(num: KtNumber): KtString {
			return KtString(num.toString())
		}
	}

	constructor(num: Int) : this(num.toDouble())

	fun asKotlinInt(): Int {
		TODO()
	}

	operator fun plus(anotherNumber: KtNumber): KtNumber {
		return KtNumber(this.inner.plus(anotherNumber.inner))
	}

	operator fun minus(anotherNumber: KtNumber): KtNumber {
		return KtNumber(this.inner.minus(anotherNumber.inner))
	}

	operator fun unaryMinus(): KtNumber {
		return KtNumber(this.inner.unaryMinus())
	}

	operator fun compareTo(other: KtNumber): Int {
		return this.inner.compareTo(other.inner)
	}

	operator fun inc(): KtNumber {
		return KtNumber(this.inner.inc())
	}

	operator fun times(other: KtNumber): KtNumber {
		return KtNumber(this.inner.times(other.inner))
	}


}

