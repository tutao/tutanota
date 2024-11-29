import { noOp, promiseMap, sortableTimestamp } from "@tutao/tutanota-utils"
import { DataFile } from "../../../common/api/common/DataFile"
import { downloadMailBundle } from "./Bundler"
import { isDesktop } from "../../../common/api/common/Env"
import type { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import type { EntityClient } from "../../../common/api/common/EntityClient"
import { locator } from "../../../common/api/main/CommonLocator"
import { FileController, zipDataFiles } from "../../../common/file/FileController"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { OperationId } from "../../../common/api/main/OperationProgressTracker.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import { CryptoFacade } from "../../../common/api/worker/crypto/CryptoFacade.js"
import { MailBundle, MailExportMode } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { generateExportFileName, mailToEmlFile } from "./emlUtils.js"

export async function generateMailFile(bundle: MailBundle, fileName: string, mode: MailExportMode): Promise<DataFile> {
	return mode === "eml" ? mailToEmlFile(bundle, fileName) : locator.fileApp.mailToMsg(bundle, fileName)
}

export async function getMailExportMode(): Promise<MailExportMode> {
	if (isDesktop()) {
		const ConfigKeys = await import("../../../common/desktop/config/ConfigKeys")
		const mailExportMode = (await locator.desktopSettingsFacade
			.getStringConfigValue(ConfigKeys.DesktopConfigKey.mailExportMode)
			.catch(noOp)) as MailExportMode
		return mailExportMode ?? "eml"
	} else {
		return "eml"
	}
}

/**
 * export mails. a single one will be exported as is, multiple will be put into a zip file
 * a save dialog will then be shown
 * @returns {Promise<Mail[]>} resolved with failed mails or empty after the fileController
 * was instructed to open the new zip File containing the exported files
 */
export async function exportMails(
	mails: Array<Mail>,
	mailFacade: MailFacade,
	entityClient: EntityClient,
	fileController: FileController,
	cryptoFacade: CryptoFacade,
	operationId?: OperationId,
	signal?: AbortSignal,
): Promise<{ failed: Mail[] }> {
	let cancelled = false

	const onAbort = () => {
		cancelled = true
	}

	try {
		// Considering that the effort for generating the bundle is higher
		// than generating the files, we need to consider it twice, so the
		// total effort would be (mailsToBundle * 2) + filesToGenerate
		const totalMails = mails.length * 3
		let doneMails = 0
		const errorMails: Mail[] = []

		signal?.addEventListener("abort", onAbort)
		const updateProgress =
			operationId !== undefined ? () => locator.operationProgressTracker.onProgress(operationId, (++doneMails / totalMails) * 100) : noOp

		//The only way to skip a Promise is throwing an error.
		//this throws just a CancelledError to be handled by the try/catch statement.

		//This function must be called in each iteration across all promises since
		//throwing it inside the onAbort function doesn't interrupt the pending promises.
		const checkAbortSignal = () => {
			if (cancelled) throw new CancelledError("export cancelled")
		}

		const downloadPromise = promiseMap(mails, async (mail) => {
			checkAbortSignal()
			try {
				const { htmlSanitizer } = await import("../../../common/misc/HtmlSanitizer")
				return await downloadMailBundle(mail, mailFacade, entityClient, fileController, htmlSanitizer, cryptoFacade)
			} catch (e) {
				errorMails.push(mail)
			} finally {
				updateProgress()
				updateProgress()
			}
		})

		const [mode, bundles] = await Promise.all([getMailExportMode(), downloadPromise])
		const dataFiles: DataFile[] = []
		for (const bundle of bundles) {
			if (!bundle) continue

			checkAbortSignal()
			const mailFile = await generateMailFile(bundle, generateExportFileName(bundle.subject, new Date(bundle.receivedOn), mode), mode)
			dataFiles.push(mailFile)
			updateProgress()
		}

		const zipName = `${sortableTimestamp()}-${mode}-mail-export.zip`
		const outputFile = await (dataFiles.length === 1 ? dataFiles[0] : zipDataFiles(dataFiles, zipName))
		await fileController.saveDataFile(outputFile)

		return {
			failed: errorMails,
		}
	} catch (e) {
		if (e.name !== "CancelledError") throw e
	} finally {
		signal?.removeEventListener("abort", onAbort)
	}

	return { failed: [] }
}
