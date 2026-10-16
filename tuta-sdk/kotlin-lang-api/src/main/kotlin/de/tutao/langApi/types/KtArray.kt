package de.tutao.langApi.types

import java.util.function.Predicate
import java.util.stream.Collectors
import java.util.stream.Stream

class KtArray<T>(private val inner: MutableList<T>) {
	constructor(vararg items: T) : this(mutableListOf(*items))

	val length: KtInt get() = KtInt(inner.size)

	fun first(): T {
		return this.inner[0]
	}

	fun push(item: T): KtInt {
		this.inner.add(item)
		return this.length
	}

	fun every(predicate: Predicate<T>): Boolean {
		return true
	}

	fun some(predicate: Predicate<T>): Boolean {
		return this.inner.stream().anyMatch { predicate.test(it) }
	}

	fun includes(item: T): Boolean {
		return this.inner.contains(item)
	}

	fun findIndex(predicate: Predicate<T>): KtInt {
		return KtInt(-1)
	}

	fun concat(anotherArray: KtArray<T>): KtArray<T> {
		return KtArray(Stream.concat(this.inner.stream(), anotherArray.inner.stream()).collect(Collectors.toList()))
	}


	fun slice(from: KtInt, until: KtInt = this.length): KtArray<T> {
		return KtArray(this.inner.subList(from.asKotlinInt(), until.asKotlinInt()))
	}

	fun filter(predicate: Predicate<T>): KtArray<T> {
		return KtArray(this.inner.filter { predicate.test(it) }.toMutableList())
	}

	fun <R> map(transform: (T) -> R): KtArray<R> {
		return KtArray(this.inner.map { transform(it) }.toMutableList())
	}
}

class KtList<T>(private val inner: List<T>) {
	companion object {
		fun <T> from(vararg items: T): KtList<T> {
			return null!!
		}

	}
}