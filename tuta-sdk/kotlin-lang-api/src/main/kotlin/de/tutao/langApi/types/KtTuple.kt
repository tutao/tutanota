package de.tutao.langApi.types

class Tuple<First, Second>(private val first: First, private val second: Second) {
	fun first(): First {
		return first
	}

	fun second(): Second {
		return second
	}
}

class Triple<First, Second, Third>(
	private val first: First,
	private val second: Second,
	private val third: Third,
) {
	fun first(): First {
		return first
	}

	fun second(): Second {
		return second
	}

	fun third(): Third {
		return third
	}
}
