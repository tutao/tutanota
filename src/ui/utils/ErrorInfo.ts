import { isNotNull } from "@tutao/utils"

export interface ErrorInfo {
	readonly name: string | null
	readonly message: string | null
	readonly stack?: string | null
}
export function errorToString(error: ErrorInfo): string {
	let errorString = error.name ?? "?"

	if (isNotNull(error.message)) {
		errorString += `\n Error message: ${error.message}`
	}

	if (isNotNull(error.stack)) {
		// the error id is included in the stacktrace
		errorString += `\nStacktrace: \n${error.stack}`
	}

	return errorString
}

export function errorsToString(errors: Array<ErrorInfo>): string {
	return errors.map(errorToString).join("\n--- next error ---\n")
}
