//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"
import type { ImportErrorData } from "../../../desktop/mailimport/DesktopMailImportFacade.js"
import { TutanotaErrorWithData } from "@tutao/lang-api"

export const enum ImportErrorCategories {
	ImportFeatureDisabled,
	LocalSdkError,
	ServerCommunicationError,
	InvalidImportFilesErrors,
	ImportIncomplete,
	ConcurrentImport,
	ImportTargetFolderDeleted,
}

export class MailImportError extends TutanotaError implements TutanotaErrorWithData<ImportErrorData> {
	constructor(public data: Readonly<ImportErrorData>) {
		super("MailImportError", "Failed to import mails")
	}
}
