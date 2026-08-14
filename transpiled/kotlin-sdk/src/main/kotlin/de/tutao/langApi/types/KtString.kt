package de.tutao.langApi.types

class KtString(val inner: String) {
  var length: KtNumber = KtNumber(inner.length)

  fun indexOf(hay: KtString): KtNumber {
    // FIXME: implement
    return KtNumber(0)
  }

  fun asKtString(): String {
    return this.inner
  }
}
