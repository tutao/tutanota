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
import { elementIdPart, GENERATED_MAX_ID } from "../../../common/api/common/utils/EntityUtils.js"
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../model/MailModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { LocalImportMailState } from "../../../common/native/common/generatedipc/LocalImportMailState.js"

export class MailImporter implements MailImportFacade {
	public nativeMailImportFacade: NativeMailImportFacade | null = null
	public credentialsProvider: CredentialsProvider | null = null
	private domainConfigProvider: DomainConfigProvider
	private loginController: LoginController

	public mailModel: MailModel
	public mailboxDetail: MailboxDetail | null = null

	private mailboxModel: MailboxModel
	private entityClient: EntityClient

	public importMailStates: Map<Id, ImportMailState> = new Map()
	public startedCancellations: Set<Id> = new Set<Id>()

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

	async init(): Promise<void> {
		this.mailboxDetail = first(await this.mailboxModel.getMailboxDetails())
		if (this.mailboxDetail) {
			const importMailStatesCollection = await this.entityClient.loadRange(
				ImportMailStateTypeRef,
				this.mailboxDetail.mailbox.mailImportStates,
				GENERATED_MAX_ID,
				10,
				true,
			)
			for (const importMailState of importMailStatesCollection) {
				this.importMailStates.set(elementIdPart(importMailState._id), importMailState)
			}
		}
	}

	updateImportMailState(importMailStateElementId: Id, importMailState: ImportMailState) {
		this.importMailStates.set(importMailStateElementId, importMailState)
	}

	deleteStartedCancellation(importMailStateElementId: Id) {
		this.startedCancellations.delete(importMailStateElementId)
	}

	async reloadMailboxDetails() {
		this.mailboxDetail = first(await this.mailboxModel.getMailboxDetails())
	}

	/**
	 * High-level call to the import facade to start an email import
	 * @param targetFolder The folder in which to import mails into
	 * @param filePaths The file paths to the eml/mbox files that are to be imported
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
			console.log("started native facade import")
			await this.nativeMailImportFacade.importFromFiles(apiUrl, unencryptedCredentials, ownerGroup, targetFolder._id, filePaths)
		}
	}

	/**
	 * Delegates to the import facade that the import should be stopped once the currently imported mail is processed
	 */
	async stopImport(importMailStateElementId: Id) {
		if (this.nativeMailImportFacade) {
			this.startedCancellations.add(importMailStateElementId)
			await this.nativeMailImportFacade.stopImport(importMailStateElementId)
		}
	}

	async onNewLocalImportMailState(localImportMailState: LocalImportMailState): Promise<void> {
		const currentState = this.importMailStates.get(localImportMailState.importMailStateElementId)
		if (currentState && currentState.status == ImportStatus.Running) {
			currentState.status = localImportMailState.status.toString()
			currentState.successfulMails = localImportMailState.successfulMails.toString()
			currentState.failedMails = localImportMailState.failedMails.toString()
			m.redraw()
		} else {
			// We have not received the create event yet or the import has already been finished/canceled.
			// We can not show any state until we get first entity event from the server announcing the
			// ImportMailState elementId used as key in the importMailStates map.
		}
	}
}
