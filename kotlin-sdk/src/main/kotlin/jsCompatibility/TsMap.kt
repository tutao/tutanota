package de.tutao.jsCompatibility

class TsMap<K, V>() {
	private var map: MutableMap<K, V> = HashMap()

	constructor(inputArray: Array<Array<Any>>) : this() {
		for (oneEntry in inputArray) {
			assert(oneEntry.size == 2) { "One key and one value expected" }
			this.map[oneEntry[0] as K] = oneEntry[1] as V
		}
	}
}