import { PluginLanguageCode } from "./hostApi/PluginHostApi"
import { TutanotaError } from "@tutao/app-env"

export class GeneralPluginError extends TutanotaError {
	public static readonly ERROR_NAME: Readonly<string> = "GeneralPluginError"
	constructor(
		message: string,
		public readonly messageTranslations: Partial<Record<PluginLanguageCode, string>> = {},
	) {
		super(GeneralPluginError.ERROR_NAME, message)
	}
}

export class HostApiPermissionDenied extends TutanotaError {
	public static readonly ERROR_NAME: Readonly<string> = "HostApiPermissionDenied"
	constructor(message: string) {
		super(HostApiPermissionDenied.ERROR_NAME, message)
	}
}

export class CustomerConfigPluginError extends TutanotaError {
	public static readonly ERROR_NAME: Readonly<string> = "CustomerConfigPluginError"

	constructor(message: string) {
		super(CustomerConfigPluginError.ERROR_NAME, message)
	}
}
