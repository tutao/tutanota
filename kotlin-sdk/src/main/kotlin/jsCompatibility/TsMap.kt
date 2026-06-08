package de.tutao.jsCompatibility

class TsMap<K, V>(private val map: Map<K, V>) : Map<K, V> by map {
}