package de.tutao.langApi

fun <T> neverNull(item: T?): T {
	if (item == null) {
		println("Called neverNull with a null value")
	}

	return item as T
}

fun <T> assertNotNull(item: T?): T {
	if (item == null) {
		throw Error("")
	}
}
