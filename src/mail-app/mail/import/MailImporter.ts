import { getApiBaseUrl } from "../../../common/api/common/Env"
import { ImportMailState, ImportMailStateTypeRef, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { assertNotNull, first, isEmpty } from "@tutao/tutanota-utils"
import { NativeMailImportFacade } from "../../../common/native/common/generatedipc/NativeMailImportFacade"
import { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider"
import { LoginController } from "../../../common/api/main/LoginController"
import { MailImportFacade } from "../../../common/native/common/generatedipc/MailImportFacade.js"
import { ImportStatus } from "../../../common/api/common/TutanotaConstants.js"
import m from "mithril"
import Id from "../../translations/id.js"
import { elementIdPart, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../model/MailModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { LocalImportMailState } from "../../../common/native/common/generatedipc/LocalImportMailState.js"

export class MailImporter implements MailImportFacade {
	public nativeMailImportFacade: NativeMailImportFacade | null = null
	public credentialsProvider: CredentialsProvider | null = null

	private domainConfigProvider: DomainConfigProvider
	private loginController: LoginController
	public mailboxModel: MailboxModel
	public mailModel: MailModel
	private entityClient: EntityClient

	private importMailStates: Map<Id, ImportMailState> = new Map()
	public waitingForFirstEvent: boolean = false
	public startedCancellation: boolean = false
	private importMailStateId: IdTuple | null = null

	constructor(
		domainConfigProvider: DomainConfigProvider,
		loginController: LoginController,
		mailboxModel: MailboxModel,
		mailModel: MailModel,
		entityClient: EntityClient,
	) {
		this.domainConfigProvider = domainConfigProvider
		this.loginController = loginController
		this.mailboxModel = mailboxModel
		this.mailModel = mailModel
		this.entityClient = entityClient
	}

	async initImportMailStates(): Promise<void> {
		if (this.nativeMailImportFacade) {
			try {
				this.importMailStateId = await this.nativeMailImportFacade.getResumableImportStateId()
			} catch (e) {
				if (e instanceof Error && e.message === "NoElementIdForState") {
					console.log("nothing to resume")
				} else {
					throw e
				}
			}
			let mailboxDetail = first(await this.mailboxModel.getMailboxDetails())
			if (mailboxDetail) {
				const importMailStatesCollection = await this.entityClient.loadAll(ImportMailStateTypeRef, mailboxDetail.mailbox.mailImportStates)
				for (const importMailState of importMailStatesCollection) {
					this.updateImportMailState(elementIdPart(importMailState._id), importMailState)
				}
			}
		}
		m.redraw()
	}

	getAllImportMailStates(): Array<ImportMailState> {
		return Array.from(this.importMailStates.values())
	}

	getNonRunningImportMailStates(): Array<ImportMailState> {
		return this.getAllImportMailStates().filter((importMailState) => importMailState.status != ImportStatus.Running)
	}

	getRunningImportMailState(): ImportMailState | null {
		for (let importMailState of this.importMailStates.values()) {
			if (importMailState.status == ImportStatus.Running || isSameId(importMailState._id, this.importMailStateId)) {
				return importMailState
			}
		}
		return null
	}

	updateImportMailState(importMailStateElementId: Id, importMailState: ImportMailState) {
		this.importMailStates.set(importMailStateElementId, importMailState)
	}

	isMailImportRunning(): boolean {
		for (let importMailState of this.importMailStates.values()) {
			if (importMailState.status == ImportStatus.Running) {
				return true
			}
		}
		return false
	}

	/**
	 * Call to the nativeMailImportFacade in worker to start a mail import from .eml or .mbox files.
	 * @param targetFolder in which to import mails into
	 * @param filePaths to the .eml/.mbox files to import mails from
	 */
	async importFromFiles(targetFolder: MailFolder, filePaths: Array<string>) {
		if (isEmpty(filePaths)) {
			return
		}
		const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
		const ownerGroup = assertNotNull(targetFolder._ownerGroup)
		const userId = this.loginController.getUserController().userId
		const unencryptedCredentials = await this.credentialsProvider!.getDecryptedCredentialsByUserId(userId)
		if (unencryptedCredentials && this.nativeMailImportFacade) {
			console.log("starting mail import...")
			await this.nativeMailImportFacade.importFromFiles(apiUrl, unencryptedCredentials, ownerGroup, targetFolder._id, filePaths)
		}
	}

	/**
	 * Stop a currently ongoing import, identified by the corresponding importMailStateElementId.
	 */
	async stopImport(importMailStateElementId: Id) {
		if (this.nativeMailImportFacade) {
			await this.nativeMailImportFacade.stopImport(importMailStateElementId)
		}
	}

	/**
	 * Stop a currently ongoing import, identified by the corresponding importMailStateElementId.
	 */
	async resumeImport() {
		const id = this.importMailStateId
		if (id) {
			const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
			const userId = this.loginController.getUserController().userId
			const unencryptedCredentials = await this.credentialsProvider!.getDecryptedCredentialsByUserId(userId)
			if (unencryptedCredentials && this.nativeMailImportFacade) {
				console.log("resuming mail import...")
				await this.nativeMailImportFacade.resumeImport(apiUrl, unencryptedCredentials, id)
			}
		}
	}

	/**
	 * New localImportMailState event received from native mail import process.
	 * Used to update import progress locally without sending entityEvents.
	 * @param localImportMailState
	 */
	async onNewLocalImportMailState(localImportMailState: LocalImportMailState): Promise<void> {
		let currentState = this.importMailStates.get(localImportMailState.importMailStateElementId) ?? null
		if (currentState && currentState.status == ImportStatus.Running) {
			currentState.status = localImportMailState.status.toString()
			currentState.successfulMails = localImportMailState.successfulMails.toString()
			currentState.failedMails = localImportMailState.failedMails.toString()
			this.updateImportMailState(elementIdPart(currentState._id), currentState)
			m.redraw()
		} else {
			// We have not received the create event yet or the import has already been finished/canceled.
			// We can not show any state until we get first entity event from the server announcing the
			// ImportMailState elementId used as key in the importMailStates map.
		}
	}
}
