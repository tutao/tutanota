/**
 * @file Functions to automatically expose certain interfaces across the WorkerProtocol Queue.
 */
import { downcast } from "@tutao/tutanota-utils"
import { Request } from "./threading/MessageDispatcher.js"
import { ProgrammingError } from "./error/ProgrammingError"

type RequestSender<RequestTypes> = (arg0: Request<RequestTypes>) => Promise<any>

/**
 * Generates proxy where each field will be treated as an interface with async methods. Each method will delegate to the
 * {@param requestSender}.
 * Attention! Make sure that the *only* fields on T are facades. Every facade method must return promise or Bad Things will happen.
 * You should specify T explicitly to avoid mistakes.
 */
export function exposeRemote<T>(requestSender: RequestSender<"facade">): T {
	// Outer proxy is just used to generate individual facades
	const workerProxy = new Proxy(
		{},
		{
			get: (target: {}, property: string) => {
				return facadeProxy(requestSender, property)
			},
		},
	)
	return downcast<T>(workerProxy)
}

/**
 * Generate a handler which will delegate to {@param impls}.
 * Attention! Make sure that the *only* fields on T are facades. Every facade method must return promise or Bad Things will happen.
 * You should specify T explicitly to avoid mistakes.
 */
export function exposeLocal<T extends object, IncomingRequestType>(impls: T): (message: Request<IncomingRequestType>) => Promise<any> {
	return (message: Request<IncomingRequestType>) => {
		const [facade, fn, args] = message.args
		const impl = downcast(impls)[facade]

		if (impl == null) {
			throw new ProgrammingError(`Facade is not exposed: ${facade}.${fn} (exposeLocal)`)
		}

		return downcast(impl)[fn](...args)
	}
}

export type FacadeImpls = {
	[facade: string]: any
}

export type DelayedImpls<IMPLS extends FacadeImpls> = {
	[Property in keyof IMPLS]: () => Promise<IMPLS[Property]>
}

/**
 * Generate a handler which will delegate to {@param impls}.
 * Attention! Make sure that the *only* fields on T are functions that resolve to facades. Every facade method must return promise or Bad Things will happen.
 * You should specify T explicitly to avoid mistakes.
 */
export function exposeLocalDelayed<T extends DelayedImpls<FacadeImpls>, IncomingRequestType>(
	impls: T,
): (message: Request<IncomingRequestType>) => Promise<any> {
	return async (message: Request<IncomingRequestType>) => {
		const [facade, fn, args] = message.args
		const init = downcast(impls)[facade]

		if (init == null) {
			throw new ProgrammingError(`Facade is not exposed: ${facade}.${fn} (exposeLocal)`)
		}

		const impl = await init()
		if (impl == null) {
			throw new ProgrammingError(`Facade is not lazy: ${facade}.${fn} (exposeLocalDelayed)`)
		}

		return downcast(impl)[fn](...args)
	}
}

/**
 * Generates proxy which will generate methods which will simulate methods of the facade.
 */
function facadeProxy(requestSender: RequestSender<"facade">, facadeName: string) {
	return new Proxy(
		{},
		{
			get: (target: {}, property: string) => {
				// We generate whatever property is asked from us and we assume it is a function. It is normally enforced by the type system
				// but runtime also tests for certain properties e.g. when returning a value from a promise it will try to test whether it
				// is "promisable". It is doing so by checking whether there's a "then" function. So we explicitly say we don't have such
				// a function.
				if (property === "then") {
					return undefined
				} else {
					return (...args: any[]) => {
						const request = new Request("facade" as const, [facadeName, property, args])
						return requestSender(request)
					}
				}
			},
		},
	)
}
