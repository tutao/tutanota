package de.tutao.jsCompatibility

object TsObject {
	// == objects.freeze
	fun <T> freeze(items: Array<T>): List<T> = items.toList()
	fun <T> freeze(items: List<T>): List<T> = items.toList()

	@Deprecated(message = "Objects.freeze on non-array is not supported", level = DeprecationLevel.ERROR)
	fun <T> freeze(nonArray: T): Nothing = error("not reachable!")

	//
}