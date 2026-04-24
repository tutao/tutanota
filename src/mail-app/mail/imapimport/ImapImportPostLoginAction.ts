import { LoggedInEvent, PostLoginAction } from "../../../common/api/main/LoginController"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { assertNotNull } from "@tutao/utils"
import { isInternalUser } from "../../../common/api/common/utils/UserUtils"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"
import { ImapImporter, InitializeImapImportParams } from "../../workerUtils/imapimport/ImapImporter"
import { DEFAULT_IMAP_IMPORT_MAX_QUOTA } from "../../settings/imapimport/ConfigureImapImportPage"
import { SyncDonePriority, SyncTracker } from "../../../common/api/main/SyncTracker"

/**
 * continue an IMAP import after login if there is one.
 */
export class ImapImportPostLoginAction implements PostLoginAction {
	constructor(
		private readonly imapImporter: ImapImporter,
		private readonly customerFacade: CustomerFacade,
		private readonly entityClient: EntityClient,
		private readonly syncTracker: SyncTracker,
	) {}

	async onPartialLoginSuccess(_: LoggedInEvent): Promise<void> {
		// do nothing
	}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {
		await this.customerFacade.loadCustomizations()
		const user = assertNotNull(await this.customerFacade.getUser())
		if (isInternalUser(user)) {
			const ownerGroups = filterMailMemberships(user)
			for (const ownerGroup of ownerGroups) {
				const mailboxGroupRoot = await this.entityClient.load(tutanotaTypeRefs.MailboxGroupRootTypeRef, ownerGroup.group)
				const mailbox = await this.entityClient.load(tutanotaTypeRefs.MailBoxTypeRef, mailboxGroupRoot.mailbox)
				if (mailbox.imapAccountSyncStates) {
					const imapAccountSyncStatesForMailbox = await this.entityClient.loadAll(
						tutanotaTypeRefs.ImportImapAccountSyncStateTypeRef,
						mailbox.imapAccountSyncStates,
					)
					for (const imapAccountSyncState of imapAccountSyncStatesForMailbox) {
						this.syncTracker.addSyncDoneListener({
							onSyncDone: async () => {
								let rootImportMailFolderName: string = ""
								if (imapAccountSyncState.rootImportMailFolder !== null) {
									const rootMailFolder = await this.entityClient.load(
										tutanotaTypeRefs.MailSetTypeRef,
										imapAccountSyncState.rootImportMailFolder,
									)
									rootImportMailFolderName = rootMailFolder.name
								}
								const initializeImapImportParams: InitializeImapImportParams = {
									host: imapAccountSyncState.imapAccount.host,
									port: parseInt(imapAccountSyncState.imapAccount.port),
									username: imapAccountSyncState.imapAccount.userName,
									password: imapAccountSyncState.imapAccount.password,
									accessToken: null,
									maxQuota: DEFAULT_IMAP_IMPORT_MAX_QUOTA,
									rootImportMailFolderName: rootImportMailFolderName,
									matchImportFoldersToTutanotaFolders: rootImportMailFolderName.length === 0,
									isModifyingExistingImport: false,
								}
								try {
									await this.imapImporter.initializeImport(initializeImapImportParams)
									//FIXME: Add validation somehow for when continue here fails.
									await this.imapImporter.continueImport()
								} catch (e) {
									console.log(
										`failed to continue imap import for group: ${ownerGroup.group}, imapAccountSyncState: ${imapAccountSyncState._id}`,
										e,
									)
								}
							},
							priority: SyncDonePriority.LOW,
						})
					}
				}
			}
		}
	}
}
