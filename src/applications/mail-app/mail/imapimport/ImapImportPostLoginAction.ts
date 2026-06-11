import { isCustomizationEnabledForCustomer } from "../../../common/api/common/utils/CustomerUtils"
import { LoggedInEvent, PostLoginAction } from "../../../../app-kit/native-bridge/common/PostLoginAction"
import { ImapImportController } from "../../settings/imapimport/ImapImportController"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { SyncDonePriority, SyncTracker } from "../../../common/api/main/SyncTracker"
import { assertNotNull, Nullable } from "../../../../platform-kit/utils/Utils"
import { isInternalUser } from "../../../common/api/common/utils/UserUtils"
import { CustomerTypeRef } from "@tutao/entities/sys"
import { FeatureType } from "@tutao/app-env"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import {
	createManageLabelServiceLabelData,
	ImapAccountSyncStateTypeRef,
	ImapFolderSyncStateTypeRef,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailSetTypeRef,
	ManageLabelServiceLabelData,
} from "@tutao/entities/tutanota"
import { ImapFolderSyncStatus } from "../../../../entities/tutanota/Utils"
import { elementIdPart } from "@tutao/meta"
import { InitializeImapImportParams } from "../../workerUtils/imapimport/ImapImporter"
import { DEFAULT_IMAP_IMPORT_MAX_QUOTA } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ImapErrorCause } from "../../../common/api/common/utils/imapImportUtils/ImapError"
import { Dialog } from "../../../../ui/base/Dialog"
import { TranslationKey } from "../../../../ui/utils/LanguageViewModel"

/**
 * continue an IMAP import after login if there is one.
 */
export class ImapImportPostLoginAction implements PostLoginAction {
	constructor(
		private readonly imapImportController: ImapImportController,
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
		const customer = await this.entityClient.load(CustomerTypeRef, assertNotNull(user.customer))

		if (isInternalUser(user) && isCustomizationEnabledForCustomer(customer, FeatureType.ImapImport)) {
			const mailMemberships = filterMailMemberships(user)

			for (const mailMembership of mailMemberships) {
				const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailMembership.group)
				const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)

				if (mailbox.imapAccountSyncStates) {
					const imapAccountSyncStatesForMailbox = await this.entityClient.loadAll(ImapAccountSyncStateTypeRef, mailbox.imapAccountSyncStates)

					for (const imapAccountSyncState of imapAccountSyncStatesForMailbox) {
						this.syncTracker.addSyncDoneListener({
							onSyncDone: async () => {
								const imapFolderSyncStates = await this.entityClient.loadAll(
									ImapFolderSyncStateTypeRef,
									imapAccountSyncState.imapFolderSyncStateList,
								)
								if (imapFolderSyncStates.every((imapFolderSyncState) => imapFolderSyncState.status === ImapFolderSyncStatus.PAUSED)) {
									return
								}
								let rootImportMailFolderName: string = ""
								let imapMailboxesToTutaFolders: Map<string, string> | null = null
								if (imapAccountSyncState.rootImportMailFolder !== null) {
									const rootMailFolder = await this.entityClient.load(MailSetTypeRef, imapAccountSyncState.rootImportMailFolder)
									rootImportMailFolderName = rootMailFolder.name
								} else {
									imapMailboxesToTutaFolders = new Map(
										imapFolderSyncStates.map((folderSyncState) => {
											return [folderSyncState.path, elementIdPart(folderSyncState.mailFolder)]
										}),
									)
								}

								let imapSyncLabelData: Nullable<ManageLabelServiceLabelData> = null
								if (imapAccountSyncState.imapSyncLabel) {
									const imapSyncLabel = await this.entityClient.load(MailSetTypeRef, imapAccountSyncState.imapSyncLabel)
									imapSyncLabelData = createManageLabelServiceLabelData({
										color: assertNotNull(imapSyncLabel.color),
										name: imapSyncLabel.name,
									})
								}

								const matchImapMailboxesToTutaMailSets = imapAccountSyncState.rootImportMailFolder === null

								const baseInitializeImapImportParams = {
									imapAccount: imapAccountSyncState.imapAccount,
									maxQuota: DEFAULT_IMAP_IMPORT_MAX_QUOTA,
									provider: parseInt(imapAccountSyncState.provider) as ImapProvider,
									mailGroupId: mailMembership.group,
									imapSyncLabelData: imapSyncLabelData,
								}
								const initializeImapImportParams: InitializeImapImportParams = matchImapMailboxesToTutaMailSets
									? {
											...baseInitializeImapImportParams,
											matchImapMailboxesToTutaMailSets: true,
											imapMailboxesToTutaMailSets: assertNotNull(imapMailboxesToTutaFolders),
										}
									: {
											...baseInitializeImapImportParams,
											matchImapMailboxesToTutaMailSets: false,
											rootImportMailFolderName: rootImportMailFolderName,
										}

								try {
									await this.imapImportController.init()
									const session = await this.imapImportController.initializeImport(initializeImapImportParams)
									const importResult = await this.imapImportController.continueImport(session.imapAccountSyncState._id)

									if (importResult.error?.cause === ImapErrorCause.AUTH_FAILED_REFRESH_TOKEN) {
										Dialog.message("imapImportAuthFailed_msg")
									}
								} catch (e) {
									console.log(
										`failed to continue imap import for group: ${mailMembership.group}, imapAccountSyncState: ${imapAccountSyncState._id}`,
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
