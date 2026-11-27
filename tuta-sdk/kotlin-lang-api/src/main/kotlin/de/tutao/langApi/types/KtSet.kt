package de.tutao.langApi.types

class KtSet<T>(vararg items: T) {
	val size: KtInt
		get() = TODO()

	fun add(value: T): KtSet<T> {
		TODO()
	}

	fun clear() {
		TODO()
	}

	fun delete(value: T): Boolean {
		TODO()
	}

	fun difference(other: KtSet<T>): KtSet<T> {
		TODO()
	}

	fun forEach(callback: (value: T, key: T, set: KtSet<T>) -> Unit) {
		TODO()
	}

	fun has(value: T): Boolean {
		TODO()
	}

	fun intersection(other: KtSet<T>): KtSet<T> {
		TODO()
	}

	fun isDisjointFrom(other: KtSet<T>): Boolean {
		TODO()
	}

	fun isSubsetOf(other: KtSet<T>): Boolean {
		TODO()
	}

	fun isSupersetOf(other: KtSet<T>): Boolean {
		TODO()
	}

	fun symmetricDifference(other: KtSet<T>): KtSet<T> {
		TODO()
	}

	fun union(other: KtSet<T>): KtSet<T> {
		TODO()
	}
}
