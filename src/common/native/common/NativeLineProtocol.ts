/**
 * this file contains the typescript implementation of the line protocol
 * for IPC used by the mobile apps that can't use the structured clone
 * algorithm.
 *
 * to prevent us from parsing the messages twice -- once as a dict to find
 * out the type and method, a second time to parse the arguments into
 * their actual types -- we use a line-based protocol. It supports
 * requests with arbitrary arguments, responses with a return value
 * and request errors with an attached error object and works as
 * follows:
 *
 * 	line		type		content				note
 *  [1] 		all			<type> 				"request", "response" or "responseError"
 *  [2]			all			<requestId>			a string like "main123", responses and errors cite the original requestId
 *  [3]			request		<method>			a string method name to invoke
 *  [3]			response	<return>			json-encoded return value
 *  [3]			error		<error>				json-encoded error object
 *  [4]			request		<arg0>				json-encoded first argument
 *  ...
 *  [n] 		request		<argx>				json-encoded last argument
 */
import { Message, Request, RequestError, Response } from "../../api/common/threading/MessageDispatcher.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { base64ToUint8Array, uint8ArrayToBase64 } from "@tutao/tutanota-utils"

export type NativeMessage = Message<NativeRequestType>
export type JsMessage = Message<JsRequestType>
export type JsMessageHandler = (message: JsMessage) => unknown

/**
 * serialize a native message to the line protocol used in the apps
 * @param message
 */
export function encodeNativeMessage(message: NativeMessage): string {
	let encodedMessage: Array<string> = []
	encodedMessage.push(message.type)
	encodedMessage.push(message.id!)
	switch (message.type) {
		case "request":
			encodedMessage.push(message.requestType)
			if (message.args.length === 0) {
				encodedMessage.push("")
			}
			for (const arg of message.args) {
				encodedMessage.push(encodeValueForNative(arg))
			}
			break
		case "response":
			encodedMessage.push(encodeValueForNative(message.value))
			break
		case "requestError":
			encodedMessage.push(encodeValueForNative(message.error))
			break
	}
	return encodedMessage.join("\n")
}

export function encodeValueForNative(value: unknown): string {
	return JSON.stringify(replaceBytesWithWrapper(value))
}

const BYTES_MARKER = "__bytes"

export function replaceBytesWithWrapper(value: unknown): unknown {
	if (value == null) {
		return null
	} else if (value instanceof Uint8Array) {
		return { data: uint8ArrayToBase64(value), marker: BYTES_MARKER }
	} else if (Array.isArray(value)) {
		return value.map(replaceBytesWithWrapper)
	} else if (typeof value === "object") {
		const newObject: Record<string, any> = {}
		for (const [key, field] of Object.entries(value)) {
			newObject[key] = replaceBytesWithWrapper(field)
		}
		return newObject
	} else {
		return value
	}
}

export function replaceWrapperByBytes(value: unknown): unknown {
	if (value == null) {
		return null
	} else if (isByteWrapper(value)) {
		return base64ToUint8Array(value.data)
	} else if (Array.isArray(value)) {
		return value.map(replaceWrapperByBytes)
	} else if (typeof value === "object") {
		const newObject: Record<string, any> = {}
		for (const [key, field] of Object.entries(value)) {
			newObject[key] = replaceWrapperByBytes(field)
		}
		return newObject
	} else {
		return value
	}
}

function isByteWrapper(value: unknown): value is { marker: typeof BYTES_MARKER; data: string } {
	return (
		value != null &&
		typeof value === "object" &&
		(value as Record<string, unknown>).marker === BYTES_MARKER &&
		typeof (value as Record<string, unknown>).data === "string"
	)
}

/**
 * decode a string received over the native bridge in the apps into a native message object
 * @param encoded
 */
export function decodeNativeMessage(encoded: string): JsMessage {
	const [type, messageId, ...rest] = encoded.split("\n")
	let parsedMessage: Message<any>
	switch (type) {
		case "request":
			const [requestType, ...args] = rest
			parsedMessage = new Request(
				requestType,
				args.map((s) => decodeValueFromNative(s)),
			)
			parsedMessage.id = messageId
			break
		case "response":
			const [value] = rest
			parsedMessage = new Response(messageId, decodeValueFromNative(value))
			break
		case "requestError":
			const [error] = rest
			parsedMessage = new RequestError(messageId, decodeValueFromNative(error) as Error)
			break
		default:
			throw new ProgrammingError(`unknown message type: ${type}`)
	}
	return parsedMessage
}

export function decodeValueFromNative(encoded: string): unknown {
	return replaceWrapperByBytes(JSON.parse(encoded))
}
