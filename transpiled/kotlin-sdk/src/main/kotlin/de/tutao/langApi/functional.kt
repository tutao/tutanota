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

	return item
}

fun <T> isNotNull(item: T?): Boolean {
	return item != null
}

fun <T> isNull(item: T?): Boolean {
	return item == null
}
