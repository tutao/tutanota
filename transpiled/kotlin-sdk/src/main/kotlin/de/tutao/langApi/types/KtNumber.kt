package de.tutao.langApi.types

class KtInt(private val inner: Int) {
	companion object {
		fun fromFloat(float: Float): KtInt {
			return null!!
		}

		fun parseInt(str: KtString): KtInt {
			return null!!
		}
	}

	fun asKotlinInt(): Int {
		return this.inner
	}

	operator fun plus(anotherNumber: KtInt): KtInt {
		return KtInt(this.inner.plus(anotherNumber.inner))
	}

	operator fun minus(anotherNumber: KtInt): KtInt {
		return KtInt(this.inner.minus(anotherNumber.inner))
	}

	operator fun unaryMinus(): KtInt {
		return KtInt(this.inner.unaryMinus())
	}

	operator fun compareTo(other: KtInt): Int {
		return this.inner.compareTo(other.inner)
	}

	operator fun inc(): KtInt {
		return KtInt(this.inner.inc())
	}

	operator fun times(other: KtInt): KtInt {
		return KtInt(this.inner.times(other.inner))
	}
}

class KtDouble(private val inner: Double) {
	companion object {
		fun from(double: Double): KtDouble {
			return KtDouble(double)
		}
	}
}
