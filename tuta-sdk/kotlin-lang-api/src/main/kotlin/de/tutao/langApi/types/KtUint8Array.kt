package de.tutao.langApi.types

class KtUint8Array {
	// Uint8Array uses unsigned values, ByteArray signed (0 to 255 vs -128 to 127)
	var value: ByteArray = ByteArray(0)

	val length: KtInt
		get() = TODO()

	operator fun get(index: KtInt): KtInt? {
		TODO()
	}

	operator fun set(index: KtInt, value: KtInt) {
		TODO()
	}

	fun subarray(begin: KtInt = KtInt(0), end: KtInt? = null): KtUint8Array {
		TODO()
	}

	fun set_notTheKeyword(array: KtArray<KtInt>, targetOffset: KtInt = KtInt(0)) {
		TODO()
	}

	fun set_notTheKeyword(array: KtUint8Array, targetOffset: KtInt = KtInt(0)) {
		TODO()
	}

	fun fill(value: KtInt, start: KtInt = KtInt(0), end: KtInt? = null): KtUint8Array {
		TODO()
	}

	companion object {
		fun from(arrayLike: Iterable<KtInt>): KtUint8Array {
			TODO()
		}

		fun <T> from(arrayLike: Iterable<T>, mapFn: (T) -> KtInt): KtUint8Array {
			TODO()
		}

		fun of(vararg elements: KtInt): KtUint8Array {
			TODO()
		}
	}
}
