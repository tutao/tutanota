package de.tutao.tutashared

enum class AesKeyLength(val keyLengthBits: Int) {
	Aes128(128),
	Aes256(256);

	val keyLengthBytes: Int
		get() = keyLengthBits / 8
}
