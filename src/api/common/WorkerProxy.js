// @flow
/**
 * @file Functions to automatically expose certain interfaces across the WorkerProtocol Queue.
 */
import {downcast} from "@tutao/tutanota-utils"
import {Queue, Request} from "./Queue"

/**
 * Generates proxy where each field will be treated as an interface with async methods. Each method will delegate to the {@param queue}.
 * Attention! Make sure that the *only* fields on T are facades. Every facade method must return promise or Bad Things will happen.
 * You should specify T explicitly to avoid mistakes.
 */
export function exposeRemote<T, OutgoingRequestType: "facade" | string, IncomingRequestType: string>(
	queue: Queue<OutgoingRequestType, IncomingRequestType>
): T {
	// Outer proxy is just used to generate individual facades
	const workerProxy = new Proxy({}, {
		get: (target: {}, property: string, receiver: Proxy<{}>) => {
			return facadeProxy<OutgoingRequestType, IncomingRequestType>(queue, property)
		}
	})
	return downcast<T>(workerProxy)
}

/**
 * Generate a handler which will delegate to {@param impls}.
 * Attention! Make sure that the *only* fields on T are facades. Every facade method must return promise or Bad Things will happen.
 * You should specify T explicitly to avoid mistakes.
 */
export function exposeLocal<T, IncomingRequestType>(impls: T): ((message: Request<IncomingRequestType>) => Promise<*>) {
	return (message: Request<IncomingRequestType>) => {
		const [facade, fn, args] = message.args
		const impl = downcast(impls)[facade]
		return downcast(impl)[fn](...args)
	}
}

/**
 * Generates proxy which will generate methods which will simulate methods of the facade.
 */
function facadeProxy<OutgoingRequestType: string, IncomingRequestType: string>(
	queue: Queue<OutgoingRequestType, IncomingRequestType>,
	facadeName: string
) {
	if (queue == null) {
		throw new Error("Queue is null")
	}
	return new Proxy({}, {
		get: (target: {}, property: string, receiver: Proxy<{}>) => {
			// We generate whatever property is asked from us and we assume it is a function. It is normally enforced by the type system
			// but runtime also tests for certain peroperties e.g. when returning a value from a promise it will try to test whether it
			// is "promisable". It is doing so by checking whether there's a "then" function. So we explicitly say we don't have such
			// a function.
			if (property === "then") {
				return undefined
			} else {
				return (...args) => {
					// $FlowIgnore[incompatible-call] I give up, I can't tell that "facade" must be one of OutgoingRequestType
					const request = new Request<OutgoingRequestType>("facade", [facadeName, property, args])
					return queue.postRequest(request)}
			}
		}
	})
}