package de.tutao.tutashared

import java.io.FilterInputStream
import java.io.IOException
import java.io.InputStream
import java.security.MessageDigest

/*
 * Copyright (C) 2013 The Guava Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */
// Adapted to use MessageDigest instead of Hasher
/**
 * An [InputStream] that maintains a hash of the data read from it.
 *
 * @author Qian Huang
 * @since 16.0
 */
class HashingInputStream
/**
 * Creates an input stream that hashes using the given [MessageDigest] and delegates all data
 * read from it to the underlying [InputStream].
 *
 *
 * The [InputStream] should not be read from before or after the hand-off.
 */
constructor(private val digest: MessageDigest, `in`: InputStream) : FilterInputStream(`in`) {
	/**
	 * Reads the next byte of data from the underlying input stream and updates the hasher with the
	 * byte read.
	 */
	@Throws(IOException::class)
	override fun read(): Int {
		val b = `in`.read()
		if (b != -1) {
			digest.update(b.toByte())
		}
		return b
	}

	/**
	 * Reads the specified bytes of data from the underlying input stream and updates the hasher with
	 * the bytes read.
	 */
	@Throws(IOException::class)
	override fun read(bytes: ByteArray, off: Int, len: Int): Int {
		val numOfBytesRead = `in`.read(bytes, off, len)
		if (numOfBytesRead != -1) {
			digest.update(bytes, off, numOfBytesRead)
		}
		return numOfBytesRead
	}

	/**
	 * mark() is not supported for HashingInputStream
	 *
	 * @return `false` always
	 */
	override fun markSupported(): Boolean {
		return false
	}

	/**
	 * mark() is not supported for HashingInputStream
	 */
	override fun mark(readlimit: Int) {}

	/**
	 * reset() is not supported for HashingInputStream.
	 *
	 * @throws IOException this operation is not supported
	 */
	@Throws(IOException::class)
	override fun reset() {
		throw IOException("reset not supported")
	}

	/**
	 * Returns the hash based on the data read from this stream. The result is unspecified
	 * if this method is called more than once on the same instance.
	 */
	fun hash(): ByteArray {
		return digest.digest()
	}
}