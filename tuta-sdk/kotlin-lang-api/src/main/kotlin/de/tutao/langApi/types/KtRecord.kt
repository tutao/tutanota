package de.tutao.langApi.types

class KtRecord<Key, Value> {
	operator fun get(key: Key): Value? {
		TODO()
	}

	operator fun set(key: Key, value: Value?) {
		TODO()
	}

	fun keys(): Iterable<Key> {
		return null!!
	}

	fun values(): Iterable<Value> {
		return null!!
	}

	fun entries(): Iterable<Pair<Key, Value>> {
		return null!!
	}
}