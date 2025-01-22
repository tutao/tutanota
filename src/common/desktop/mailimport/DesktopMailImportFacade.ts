import { ImporterApi, ImportErrorKind, ImportOkKind, MailImportErrorMessage, MailImportMessage, PreparationError, TutaCredentials } from "@tutao/node-mimimi"
import { UnencryptedCredentials } from "../../native/common/generatedipc/UnencryptedCredentials.js"
import { CredentialType } from "../../misc/credentials/CredentialType.js"
import { NativeMailImportFacade } from "../../native/common/generatedipc/NativeMailImportFacade"
import { assertNotNull, clear, defer, DeferredObject } from "@tutao/tutanota-utils"
import { ElectronExports } from "../ElectronExportTypes.js"
import { ImportErrorCategories, MailImportError } from "../../api/common/error/MailImportError.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { DesktopNotifier, NotificationResult } from "../DesktopNotifier.js"
import { LanguageViewModel } from "../../misc/LanguageViewModel.js"
import path from "node:path"

const TAG = "[DesktopMailImportFacade]"
type Listener = DeferredObject<MailImportErrorMessage>["reject"]

export type ImportErrorData =
	| { category: ImportErrorCategories.ImportFeatureDisabled }
	| { category: ImportErrorCategories.LocalSdkError; source: string }
	| { category: ImportErrorCategories.ServerCommunicationError; source: string }
	| { category: ImportErrorCategories.InvalidImportFilesErrors; source: string }
	| { category: ImportErrorCategories.ImportIncomplete; source: string }

function asyncImportErrorToMailImportErrorData(message: MailImportErrorMessage): ImportErrorData {
	const { kind } = message
	switch (kind) {
		case ImportErrorKind.FileDeletionError:
			return { category: ImportErrorCategories.InvalidImportFilesErrors, source: kind }

		case ImportErrorKind.SdkError:
		case ImportErrorKind.EmptyBlobServerList:
			return { category: ImportErrorCategories.LocalSdkError, source: kind }

		case ImportErrorKind.ImportFeatureDisabled:
			return { category: ImportErrorCategories.ImportFeatureDisabled }

		case ImportErrorKind.TooBigChunk:
		case ImportErrorKind.SourceExhaustedSomeError:
			return { category: ImportErrorCategories.ImportIncomplete, source: kind }
	}
}

function mimimiErrorToImportErrorData(error: { message: string }): ImportErrorData {
	const { message: source } = error
	switch (source) {
		// errors related to the files we use to track the import progress.
		// might require manual intervention due to misconfiguration or leftover files.
		case PreparationError.FailedToReadEmls:
		case PreparationError.StateFileWriteFailed:
		case PreparationError.CanNotCreateImportDir:
		case PreparationError.CanNotDeleteImportDir:
		case PreparationError.FileReadError:
		case PreparationError.EmlFileWriteFailure:
			return { category: ImportErrorCategories.InvalidImportFilesErrors, source }

		// errors due to problems communicating with the server (network, auth,...)
		case PreparationError.LoginError:
		case PreparationError.NoMailGroupKey:
		case PreparationError.CannotLoadRemoteState:
			return { category: ImportErrorCategories.ServerCommunicationError, source }

		case PreparationError.ImportFeatureDisabled:
			return { category: ImportErrorCategories.ImportFeatureDisabled }

		// errors that happen before we even talk to the server. usually not actionable.
		case PreparationError.NoNativeRestClient:
			return { category: ImportErrorCategories.LocalSdkError, source }

		// this one is very actionable, but we don't have associated data currently to show the user which file is bad.
		case PreparationError.NotAValidEmailFile:
			return { category: ImportErrorCategories.ImportIncomplete, source }

		default:
			// we'd like ts to check we considered all variants, but we can't do that without checking the type
			// before passing it into this function. removing the default case would cause us to lose error
			// types we didn't account for.
			throw new ProgrammingError(`unknown mimimi error ${error}`)
	}
}

/**
 * This is the persistent part of the importer running in the node main process. as long as the client is running, this will stay around.
 * windows can subscribe to events and control the importer, but are considered "disposable" and are not required for the importer to do work.
 */
export class DesktopMailImportFacade implements NativeMailImportFacade {
	private readonly configDirectory: string
	// map from mailbox id to its importer Api
	private readonly importerApis: Map<string, ImporterApi> = new Map()
	private readonly currentListeners: Map<string, Array<Listener>> = new Map()

	constructor(private readonly electron: ElectronExports, private readonly notifier: DesktopNotifier, private readonly lang: LanguageViewModel) {
		ImporterApi.initLog()
		electron.app.on("before-quit", () => ImporterApi.deinitLog())
		this.configDirectory = electron.app.getPath("userData")
	}

	async getResumableImport(
		mailboxId: string,
		targetOwnerGroup: string,
		unencryptedTutaCredentials: UnencryptedCredentials,
		apiUrl: string,
	): Promise<readonly [string, string] | null> {
		const existingImporterApi = this.importerApis.get(mailboxId)
		if (existingImporterApi) {
			const { listId, elementId } = existingImporterApi.getImportStateId()
			return [listId, elementId]
		} else {
			const tutaCredentials = this.createTutaCredentials(unencryptedTutaCredentials, apiUrl)
			let importerApi
			try {
				importerApi = await ImporterApi.getResumableImport(mailboxId, this.configDirectory, targetOwnerGroup, tutaCredentials)
			} catch (e) {
				throw new MailImportError(mimimiErrorToImportErrorData(e))
			}
			if (importerApi != null) {
				importerApi.setMessageHook((message: MailImportMessage) => this.processMimimiMessage(mailboxId, message))
				this.importerApis.set(mailboxId, importerApi)

				const { listId, elementId } = importerApi.getImportStateId()
				return [listId, elementId]
			}
		}

		return null
	}

	async prepareNewImport(
		mailboxId: string,
		targetOwnerGroup: string,
		targetMailset: readonly string[],
		filePaths: readonly string[],
		unencryptedTutaCredentials: UnencryptedCredentials,
		apiUrl: string,
	): Promise<readonly [string, string]> {
		const tutaCredentials = this.createTutaCredentials(unencryptedTutaCredentials, apiUrl)

		let importerApi
		try {
			importerApi = await ImporterApi.prepareNewImport(
				mailboxId,
				tutaCredentials,
				targetOwnerGroup,
				[targetMailset[0], targetMailset[1]],
				filePaths.slice(),
				this.configDirectory,
			)
		} catch (e) {
			throw new MailImportError(mimimiErrorToImportErrorData(e))
		}
		importerApi.setMessageHook((message: MailImportMessage) => this.processMimimiMessage(mailboxId, message))
		this.importerApis.set(mailboxId, importerApi)
		const { listId, elementId } = importerApi.getImportStateId()
		return [listId, elementId]
	}

	async setProgressAction(mailboxId: string, progressAction: number): Promise<void> {
		let importerApi = this.importerApis.get(mailboxId)
		if (!importerApi) {
			console.warn(TAG, "received progress action for nonexistent import")
			// we can ignore this - the worst that can happen is that we have an unresponsive button.
			// import was probably finished, but UI didn't get the entity event yet
			return
		}
		await importerApi.setProgressAction(progressAction)
	}

	async setAsyncErrorHook(mailboxId: string): Promise<void> {
		const { promise, reject } = defer<void>()
		const listeners = this.currentListeners.get(mailboxId)
		if (listeners != null) {
			listeners.push(reject)
		} else {
			const newListeners = [reject]
			this.currentListeners.set(mailboxId, newListeners)
		}
		return promise
	}

	private processMimimiMessage(mailboxId: string, message: MailImportMessage) {
		const haveOkMessage = message.okMessage != null
		const haveErrMessage = message.errorMessage != null

		if (haveErrMessage == haveOkMessage) {
			throw new ProgrammingError("Mail import message can either only be error or only be ok")
		} else if (haveErrMessage) {
			return this.processMimimiErrMessage(mailboxId, assertNotNull(message.errorMessage))
		}

		const okMessage = assertNotNull(message.okMessage)
		switch (okMessage) {
			case ImportOkKind.UserCancelInterruption:
				this.importerApis.delete(mailboxId)
				break
			case ImportOkKind.SourceExhaustedNoError:
				this.importerApis.delete(mailboxId)
				this.notifier
					.showOneShot({
						title: this.lang.get("importComplete_title"),
						body: this.lang.get("importComplete_msg"),
					})
					.catch()
				break
			case ImportOkKind.UserPauseInterruption:
				console.log("User pause request was complete.")
				// have to do nothing for pause
				break
		}
	}

	private processMimimiErrMessage(mailboxId: string, error: MailImportErrorMessage) {
		if (error.kind === ImportErrorKind.SourceExhaustedSomeError) {
			this.importerApis.delete(mailboxId)
		}
		let errorData = asyncImportErrorToMailImportErrorData(error)

		// this is the only category where it does not make sense for user to retry
		// because we would have already cleaned up the local state and all the files will be renamed to failed.eml
		if (errorData.category === ImportErrorCategories.ImportIncomplete) {
			this.importerApis.delete(mailboxId)
		}

		this.notifier
			.showOneShot({
				title: this.lang.get("importIncomplete_title"),
				body: this.lang.get("importIncomplete_msg"),
			})
			.then((res) => {
				if (res === NotificationResult.Click) {
					this.electron.shell.showItemInFolder(path.join(this.configDirectory, "current_imports", mailboxId, "dummy.eml"))
				}
			})

		let listeners = this.currentListeners.get(mailboxId)
		if (listeners != null) {
			for (const listener of listeners) {
				const mailImportError = new MailImportError(errorData)
				listener(mailImportError)
			}
			clear(listeners)
		}
	}

	private createTutaCredentials(unencTutaCredentials: UnencryptedCredentials, apiUrl: string) {
		const tutaCredentials: TutaCredentials = {
			accessToken: unencTutaCredentials?.accessToken,
			isInternalCredential: unencTutaCredentials.credentialInfo.type === CredentialType.Internal,
			encryptedPassphraseKey: unencTutaCredentials.encryptedPassphraseKey ? Array.from(unencTutaCredentials.encryptedPassphraseKey) : [],
			login: unencTutaCredentials.credentialInfo.login,
			userId: unencTutaCredentials.credentialInfo.userId,
			apiUrl,
			clientVersion: env.versionNumber,
		}
		return tutaCredentials
	}
}
