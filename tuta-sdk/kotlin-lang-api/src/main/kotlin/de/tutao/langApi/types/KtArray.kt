package de.tutao.langApi.types

import java.util.function.Predicate
import java.util.stream.Collectors
import java.util.stream.Stream

class KtArray<T>(private val inner: MutableList<T>) : Iterable<T> {
	constructor(vararg items: T) : this(mutableListOf(*items))

	val length: KtNumber get() = KtNumber(inner.size)

	companion object {
		fun <T> from(vararg items: T): KtArray<T> {
			return KtArray(mutableListOf(*items))
		}
	}

	operator fun get(index: KtNumber): T? {
		TODO()
	}

	fun at(index: KtNumber): T? {
		TODO()
	}

	fun second(): T {
		TODO()
	}

	fun third(): T {
		TODO()
	}

	fun atUnchecked(index: KtNumber): T {
		TODO()
	}

	fun find(predicate: (T, KtNumber, KtArray<T>) -> Boolean): T? {
		TODO()
	}

	fun find(predicate: (T, KtNumber) -> Boolean): T? {
		TODO()
	}

	fun find(predicate: (T) -> Boolean): T? {
		TODO()
	}

	fun indexOf(searchElement: T, from: KtNumber = KtNumber(0)): KtNumber {
		TODO()
	}

	fun splice(start: KtNumber, deleteCount: KtNumber? = null, vararg itemsToAdd: T): KtArray<T> {
		TODO()
	}

	fun join(separator: KtString): KtString {
		TODO()
	}

	fun reverse(): KtArray<T> {
		TODO()
	}

	operator fun set(index: KtNumber, value: T) {
		val i = index.asKotlinInt()
		if (i == this.inner.size) {
			this.inner.add(value)
		} else {
			this.inner[i] = value
		}
	}

	fun first(): T {
		return this.inner[0]
	}

	fun push(item: T): KtNumber {
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

	fun findIndex(predicate: Predicate<T>): KtNumber {
		return KtNumber(-1)
	}

	fun concat(anotherArray: KtArray<T>): KtArray<T> {
		return KtArray(Stream.concat(this.inner.stream(), anotherArray.inner.stream()).collect(Collectors.toList()))
	}


	fun slice(from: KtNumber, until: KtNumber? = null): KtArray<T> {
		return KtArray(this.inner.subList(from.asKotlinInt(), (until ?: this.length).asKotlinInt()))
	}

	fun filter(predicate: Predicate<T>): KtArray<T> {
		return KtArray(this.inner.filter { predicate.test(it) }.toMutableList())
	}

	fun <R> map(transform: (T) -> R): KtArray<R> {
		return KtArray(this.inner.map { transform(it) }.toMutableList())
	}

	fun sort(compareFn: (T, T) -> KtNumber): KtArray<T> {
		this.inner.sortWith { a, b -> compareFn(a, b).asKotlinInt() }
		return this
	}
	fun pop(): T? {
		return this.inner.removeLastOrNull()
	}

	fun shift(): T? {
		return this.inner.removeFirstOrNull()
	}

	fun <R> flatMap(transform: (T) -> Iterable<R>): KtArray<R> {
		return KtArray(this.inner.flatMap { transform(it) }.toMutableList())
	}

	override fun iterator(): Iterator<T> {
		return inner.iterator()
	}
}

typealias KtList<T> = KtArray<T>
