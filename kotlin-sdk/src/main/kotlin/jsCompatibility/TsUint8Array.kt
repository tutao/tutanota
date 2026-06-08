package de.tutao.jsCompatibility

@OptIn(ExperimentalUnsignedTypes::class)
class TsUint8Array constructor(private val arr: UByteArray) {

	val length get() = arr.size

	constructor(length: TsNumber) : this(UByteArray(length.toInt())) {}
}