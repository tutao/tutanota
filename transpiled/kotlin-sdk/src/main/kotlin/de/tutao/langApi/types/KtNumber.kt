package de.tutao.langApi.types

class KtNumber(private val inner: Int) {

	fun asKotlinInt(): Int {
		return this.inner
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
