export type ErrorAsObject = {
	data: any
	message: any
	name: any
	stack: any
}

// Serialize error stack traces, when they are sent via the websocket.
export function errorToObj(error: Error): ErrorAsObject {
	const errorErased = error as any
	return {
		name: errorErased.name,
		message: errorErased.message,
		stack: errorErased.stack,
		data: errorErased.data,
	}
}
