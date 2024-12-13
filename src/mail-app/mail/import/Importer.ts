import { getApiBaseUrl } from "../../../common/api/common/Env"
import { ImportMailState, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { assertNotNull, isEmpty } from "@tutao/tutanota-utils"
import { NativeMailImportFacade } from "../../../common/native/common/generatedipc/NativeMailImportFacade"
import { CredentialsProvider } from "../../../common/misc/credentials/CredentialsProvider"
import { DomainConfigProvider } from "../../../common/api/common/DomainConfigProvider"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { LoginController } from "../../../common/api/main/LoginController"
import { DesktopMailImportFacade } from "../../../common/desktop/mailimport/DesktopMailImportFacade.js"

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
		const unencryptedCredentials = await this.credentialsProvider.getDecryptedCredentialsByUserId(userId)

		if (unencryptedCredentials) {
			console.log("started native facade import")
			await this.nativeMailImportFacade.importFromFiles(apiUrl, unencryptedCredentials, ownerGroup, targetFolder._id, filePaths)
		}
	}

	/**
	 * Delegates to the import facade that the import should be stopped once the currently imported mail is processed
	 */
	async stopImport() {
		await this.nativeMailImportFacade.stopImport()
	}

	getLocalStateAsRemote(): Map<Id, ImportMailState> {
		if (this.nativeMailImportFacade instanceof DesktopMailImportFacade) {
			return this.nativeMailImportFacade.localImportState
		} else {
			return new Map()
		}
	}
}
