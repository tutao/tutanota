//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"
import type { ImportErrorData } from "../../../desktop/mailimport/DesktopMailImportFacade.js"

export const enum ImportErrorCategories {
	ImportFeatureDisabled,
	LocalSdkError,
	ServerCommunicationError,
	InvalidImportFilesErrors,
	ImportIncomplete,
	ConcurrentImport,
}

export class MailImportError extends TutanotaError {
	data: ImportErrorData

	constructor(data: ImportErrorData) {
		super("MailImportError", `Failed to import mails`)
		this.data = data
	}
}
