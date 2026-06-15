export interface ServiceWorkerError {
	name: string
	message: string
	stack?: string
	data?: unknown
}

/**
 * Type of the {@code "message"} that SW can send to the clients.
 *
 * **Warning**: use with caution, SW can be newer than the clients!
 */
export type ServiceWorkerMessage = { type: "error"; value: ServiceWorkerError } | { type: "updateready"; version: string }
