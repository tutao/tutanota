package de.tutao.jsCompatibility

import java.util.function.IntFunction

class TsArray<T>(private val list: List<T>) : List<T> by list {
	constructor() : this(emptyList())
	constructor(init: Array<T>) : this(init.toMutableList()) {}

	@Deprecated(level = DeprecationLevel.ERROR, message = "How do I implement this?")
	override fun <T : Any?> toArray(generator: IntFunction<Array<out T?>?>): Array<out T?>? {
		error("a")
	}
}


// ts-like .reduce() function
fun <ElementOfArray, ReducedType> Iterable<ElementOfArray>.reduce(
	op: (ReducedType, ElementOfArray) -> ReducedType,
	initial: ReducedType,
): ReducedType {
	var acc = initial
	for (item in this) {
		acc = op(acc, item)
	}
	return acc
}