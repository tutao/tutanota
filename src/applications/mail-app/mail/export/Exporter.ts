import { noOp, promiseMap, sortableTimestamp, splitInChunks } from "../../../../platform-kits/utils"
import { downloadMailBundle } from "./Bundler"
import type { EntityClient } from "../../../../platform-kits/network/EntityClient"
import { locator } from "../../../common/api/main/CommonLocator"
import { FileController, zipDataFiles } from "../../../common/file/FileController"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { OperationId } from "../../../common/api/main/OperationProgressTracker.js"
import { CancelledError, isDesktop } from "../../../../platform-kits/app-env"
import { CryptoFacade } from "../../../../platform-kits/base/crypto/CryptoFacade.js"
import { MailBundle, MailExportMode } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { generateExportFileName, mailToEmlFile } from "./emlUtils.js"
import { DataFile, Mail } from "@tutao/entities/tutanota"
import { elementIdPart } from "../../../../platform-kits/meta"

const EXPORT_CHUNK_SIZE = 10000

export async function generateMailFile(bundle: MailBundle, fileName: string, mode: MailExportMode): Promise<DataFile> {
	return mode === "eml" ? mailToEmlFile(bundle, fileName) : locator.fileApp.mailToMsg(bundle, fileName)
}

export async function getMailExportMode(): Promise<MailExportMode> {
	if (isDesktop()) {
		const ConfigKeys = await import("../../../../platform-kits/app-env/ConfigKeys")
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
	mails: ReadonlyArray<Mail>,
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

		const { getHtmlSanitizer } = await import("../../../common/misc/HtmlSanitizer")
		const htmlSanitizer = getHtmlSanitizer()
		const mailChunks = splitInChunks<Mail>(EXPORT_CHUNK_SIZE, mails)
		for (const [index, mailsChunk] of mailChunks.entries()) {
			const downloadPromise = promiseMap(mailsChunk, async (mail) => {
				checkAbortSignal()
				try {
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
				const mailFile = await generateMailFile(
					bundle,
					generateExportFileName(elementIdPart(bundle.mailId), bundle.subject, new Date(bundle.receivedOn), mode),
					mode,
				)
				dataFiles.push(mailFile)
				updateProgress()
			}

			const zipName = `${sortableTimestamp()}-${mode}-mail-export-${index + 1}.zip`
			const outputFile = await (dataFiles.length === 1 ? dataFiles[0] : zipDataFiles(dataFiles, zipName))
			await fileController.saveDataFile(outputFile)
		}

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
