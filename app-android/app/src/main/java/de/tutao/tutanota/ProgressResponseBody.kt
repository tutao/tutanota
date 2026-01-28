package de.tutao.tutanota

import okhttp3.MediaType
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource
import okio.ForwardingSource
import okio.Source
import okio.buffer

typealias ProgressListener = (bytesRead: Long, contentLength: Long, done: Boolean) -> Unit

internal class ProgressResponseBody(
	private val responseBody: ResponseBody,
	private val progressListener: ProgressListener
) : ResponseBody() {
	private var bufferedSource: BufferedSource? = null

	override fun contentType(): MediaType? {
		return responseBody.contentType()
	}

	override fun contentLength(): Long {
		return responseBody.contentLength()
	}

	override fun source(): BufferedSource {
		if (bufferedSource == null) {
			bufferedSource = source(responseBody.source()).buffer()
		}
		return bufferedSource!!
	}

	private fun source(source: Source): Source {
		return object : ForwardingSource(source) {
			var totalBytesRead: Long = 0L

			override fun read(sink: Buffer, byteCount: Long): Long {
				val bytesRead: Long = super.read(sink, byteCount)
				// read() returns the number of bytes read, or -1 if this source is exhausted.
				totalBytesRead += if (bytesRead != -1L) bytesRead else 0
				progressListener(totalBytesRead, responseBody.contentLength(), bytesRead == -1L)
				return bytesRead
			}
		}
	}
}