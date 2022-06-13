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
import {Message, Request, RequestError, Response} from "../../api/common/MessageDispatcher.js"
import {ProgrammingError} from "../../api/common/error/ProgrammingError.js"


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
	encodedMessage.push(message.id)
	switch (message.type) {
		case "request":
			encodedMessage.push(message.requestType)
			if (message.args.length === 0) {
				encodedMessage.push("")
			}
			for (const arg of message.args) {
				encodedMessage.push(JSON.stringify(arg))
			}
			break
		case "response":
			encodedMessage.push(JSON.stringify(message.value))
			break
		case "requestError":
			encodedMessage.push(JSON.stringify(message.error))
			break
	}
	return encodedMessage.join("\n")
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
			parsedMessage = new Request(requestType, args.map(s => JSON.parse(s)), messageId)
			break
		case "response":
			const [value] = rest
			parsedMessage = new Response(messageId, JSON.parse(value))
			break
		case "requestError":
			const [error] = rest
			parsedMessage = new RequestError(messageId, JSON.parse(error))
			break
		default:
			throw new ProgrammingError(`unknown message type: ${type}`)
	}
	return parsedMessage
}