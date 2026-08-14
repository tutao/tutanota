package de.tutao.langApi.types

class KtNumber(val inner: Int) {
  operator fun plus(anotherNumber: KtNumber): KtNumber {
    return KtNumber(this.inner + anotherNumber.inner)
  }

  operator fun unaryMinus(): KtNumber {
    return KtNumber(-this.inner)
  }

  operator fun compareTo(other: KtNumber): Int {
    return this.inner.compareTo(other.inner)
  }

  operator fun inc(): KtNumber {
    this.inner.inc()
    return this
  }
}
