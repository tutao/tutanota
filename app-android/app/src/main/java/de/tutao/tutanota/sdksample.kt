@file:OptIn(InternalSerializationApi::class)

package de.tutao.tutanota

import android.util.Log
import de.tutao.tutasdk.ApiCallException
import de.tutao.tutasdk.ElementValue
import de.tutao.tutasdk.HttpMethod
import de.tutao.tutasdk.IdTuple
import de.tutao.tutasdk.JsonElement
import de.tutao.tutasdk.RestClient
import de.tutao.tutasdk.RestClientException
import de.tutao.tutasdk.RestClientOptions
import de.tutao.tutasdk.RestResponse
import de.tutao.tutasdk.Sdk
import de.tutao.tutasdk.TypeRef
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.InternalSerializationApi
import kotlinx.serialization.SerialFormat
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.StructureKind
import kotlinx.serialization.encoding.CompositeDecoder
import kotlinx.serialization.internal.NamedValueDecoder
import kotlinx.serialization.modules.SerializersModule
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

private const val TAG = "SDKSAMPLE"

suspend fun runSdkExample() {
	val restClient = OkHttpRestClient()
	val sdk = Sdk(
		"http://ivk:9000",
		restClient,
	)
	sdk.login("Y92VaxGAAsABNrHX60_Ofd_ZCDNDeG-qwg")
	val mailId = "NxqKPlI--c-0/NxqKQUk----0".toIdTuple()
	val entityClient = sdk.entityClient()
	val typeRef = TypeRef("tutanota", "Mail")
	val result = try {
		entityClient.loadListElement(typeRef, mailId)
	} catch (e: ApiCallException) {
		Log.d(TAG, "request failed", e)
		return
	}
	Log.d(TAG, "LOADED RESULT FROM TUTASDK $result ")
	val sender = result.get("sender")!!.dict().get("address")!!.string()
	Log.d(TAG, "LOADED SENDER FROM TUTASDK $sender")

//	val parsedMail = EntitySerialFormat(SerializersModule { }).decodeFromRawEntity(MailEntity.serializer(), result)
//	Log.d(TAG, "parsed mail")

	val updatedMail = result.toMutableMap()
	updatedMail["unread"] = ElementValue.Bool(true)
	// FIXME need to serialize first
//	entityClient.update(typeRef, updatedMail)
}

fun ElementValue.dict(): Map<String, ElementValue> {
	return (this as ElementValue.Dict).v1
}

fun ElementValue.string(): String {
	return (this as ElementValue.String).v1
}

private fun String.toIdTuple(): IdTuple {
	val (listId, elementId) = this.split("/")
	return IdTuple(listId, elementId)
}

class OkHttpRestClient : RestClient {
	// FIXME: probably inject this?
	private val okHttpClient = OkHttpClient()
		.newBuilder()
		.connectTimeout(30, TimeUnit.SECONDS)
		.writeTimeout(20, TimeUnit.SECONDS)
		.readTimeout(20, TimeUnit.SECONDS)
		.addInterceptor { chain ->
			val request = chain.request()
			Log.d(TAG, "REQUEST ${request.method} ${request.url}")
			val response = chain.proceed(request)
			Log.d(TAG, "RESPONSE ${request.method} ${request.url} ${response.code}")
			response
		}
		.build()

	override suspend fun requestBinary(
		url: String,
		method: HttpMethod,
		options: RestClientOptions
	): RestResponse {
		val request = Request.Builder()
			.url(url)
			.method(method.name, options.body?.let(::JsonRequestBody))
			.apply {
				for ((headerName, headerValue) in options.headers) {
					addHeader(headerName, headerValue)
				}
			}
			.build()

		val response = try {
			okHttpClient.newCall(request).execute()
		} catch (e: IOException) {
			throw RestClientException.NetworkException()
		}
		return RestResponse(
			response.code.toUInt(),
			response.body?.bytes(),
		)
	}
}

@Serializable
data class MailEntity(
	val unread: Boolean,
	val subject: String,
)

class EntitySerialFormat(override val serializersModule: SerializersModule) : SerialFormat {

	private abstract inner class InMapper<Value : Any>(
		protected val map: Map<String, Value>, descriptor: SerialDescriptor
	) : NamedValueDecoder() {
		override val serializersModule: SerializersModule = this@EntitySerialFormat.serializersModule

		private var currentIndex = 0
		private val isCollection = descriptor.kind == StructureKind.LIST || descriptor.kind == StructureKind.MAP
		private val size = if (isCollection) Int.MAX_VALUE else descriptor.elementsCount

		protected abstract fun structure(descriptor: SerialDescriptor): InMapper<Value>

		final override fun beginStructure(descriptor: SerialDescriptor): CompositeDecoder {
			return structure(descriptor).also { copyTagsTo(it) }
		}

		final override fun <T> decodeSerializableValue(deserializer: DeserializationStrategy<T>): T {
			// we shouldn't need polymorphism

//			if (deserializer is AbstractPolymorphicSerializer<*>) {
//				val type = map[nested("type")]?.toString()
//				val actualSerializer: DeserializationStrategy<Any> = deserializer.findPolymorphicSerializer(this, type)
//
//				@Suppress("UNCHECKED_CAST")
//				return actualSerializer.deserialize(this) as T
//			}

			return deserializer.deserialize(this)
		}

		final override fun decodeTaggedValue(tag: String): Value {
			return map.getValue(tag)
		}

		override fun decodeTaggedBoolean(tag: String): Boolean {
			return when (val encodedBool = map.getValue(tag)) {
				"0" -> false
				"1" -> true
				else -> throw SerializationException("Invalid bool value: $encodedBool for $tag")
			}
		}

		final override fun decodeTaggedEnum(tag: String, enumDescriptor: SerialDescriptor): Int {
			return when (val taggedValue = map.getValue(tag)) {
				is Int -> taggedValue
				is String -> enumDescriptor.getElementIndex(taggedValue)
					.also { if (it == CompositeDecoder.UNKNOWN_NAME) throw SerializationException("Enum '${enumDescriptor.serialName}' does not contain element with name '$taggedValue'") }

				else -> throw SerializationException("Value of enum entry '$tag' is neither an Int nor a String")
			}
		}

		final override fun decodeElementIndex(descriptor: SerialDescriptor): Int {
			while (currentIndex < size) {
				val name = descriptor.getTag(currentIndex++)
				if (map.keys.any {
						it.startsWith(name) && (it.length == name.length || it[name.length] == '.')
					}) return currentIndex - 1
				if (isCollection) {
					// if map does not contain key we look for, then indices in collection have ended
					break
				}
			}
			return CompositeDecoder.DECODE_DONE
		}
	}

	private inner class InAnyMapper(
		map: Map<String, Any>, descriptor: SerialDescriptor
	) : InMapper<Any>(map, descriptor) {
		override fun structure(descriptor: SerialDescriptor): InAnyMapper =
			InAnyMapper(map, descriptor)
	}

	fun <T> decodeFromRawEntity(deserializer: DeserializationStrategy<T>, raw: Map<String, JsonElement>): T {
		val m = InAnyMapper(raw, deserializer.descriptor)
		return m.decodeSerializableValue(deserializer)
	}
}