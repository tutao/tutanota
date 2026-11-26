package de.tutao.langApi.types

class KtUint8Array {
	// Uint8Array uses unsigned values, ByteArray signed (0 to 255 vs -128 to 127)
	var value: ByteArray = ByteArray(0)
	val length: KtInt = TODO()

	public fun fill(n: KtInt): Unit{
		TODO()
	}

	public fun set_notTheKeyword(source: KtUint8Array): Unit {
		TODO()
	}

	public fun subarray(start: KtInt): KtUint8Array {
		TODO()
	}

	operator fun get(int: KtInt): KtInt {
		TODO()
	}

	operator fun set(int: KtInt, value: KtInt): Unit {
		TODO()
	}

}
