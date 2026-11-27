import { isNotNull, Nullable } from "@tutao/lang-api"

export interface ErrorInfo {
	readonly name: Nullable<string>
	readonly message: Nullable<string>
	readonly stack: Nullable<string>
}

export function errToErrorInfo(err: Error): ErrorInfo {
	return {
		stack: err.stack ?? null,
		...err,
	}
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
