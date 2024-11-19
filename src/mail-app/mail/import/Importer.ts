import { getApiBaseUrl } from "../../../common/api/common/Env"
import { createImportMailState, ImportMailStateTypeRef, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { ImportStatus } from "../../../common/api/common/TutanotaConstants"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { assertNotNull } from "@tutao/tutanota-utils"
import { NativeMailImportFacade } from "../../../common/native/common/generatedipc/NativeMailImportFacade"
import { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { LoginController } from "../../../common/api/main/LoginController"

export class Importer {
	private nativeMailImportFacade: NativeMailImportFacade
	private credentialsProvider: CredentialsProvider
	private domainConfigProvider: DomainConfigProvider
	private loginController: LoginController
	private entityClient: EntityClient

	constructor(
		nativeMailImportFacade: NativeMailImportFacade,
		credentialsProvider: CredentialsProvider,
		domainConfigProvider: DomainConfigProvider,
		loginController: LoginController,
		entityClient: EntityClient,
	) {
		this.nativeMailImportFacade = nativeMailImportFacade
		this.credentialsProvider = credentialsProvider
		this.domainConfigProvider = domainConfigProvider
		this.loginController = loginController
		this.entityClient = entityClient
	}

	async importFromFiles(targetFolder: MailFolder, mailboxDetail: MailboxDetail, filePaths: Array<string>) {
		const apiUrl = getApiBaseUrl(this.domainConfigProvider.getCurrentDomainConfig())
		const ownerGroup = assertNotNull(targetFolder._ownerGroup)
		let importMailState = createImportMailState({
			_ownerGroup: ownerGroup,
			status: ImportStatus.NotInitialized.toString(),
			targetFolder: targetFolder._id,
		})
		const userId = this.loginController.getUserController().userId
		const unencryptedCredentials = await this.credentialsProvider.getDecryptedCredentialsByUserId(userId)

		if (unencryptedCredentials) {
			const mailImportStatesListId = mailboxDetail.mailbox.mailImportStates
			let importMailStateId: IdTuple = [mailImportStatesListId, await this.entityClient.setup(mailImportStatesListId, importMailState)]
			importMailState = await this.entityClient.load(ImportMailStateTypeRef, importMailStateId)

			let result = await this.nativeMailImportFacade.importFromFiles(apiUrl, unencryptedCredentials, ownerGroup, targetFolder._id, filePaths)
			console.log("finished import", result)

			importMailState.status = ImportStatus.Finished
			await this.entityClient.update(importMailState)
		}
	}
}
