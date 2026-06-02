export class IgnorableError extends Error {
	constructor(msg: string) {
		super("This error can be ignored: " + msg)
	}
}
