import { isCustomizationEnabledForCustomer } from "../../../common/api/common/utils/CustomerUtils"
import { LoggedInEvent, PostLoginAction } from "../../../../app-kit/native-bridge/common/PostLoginAction"
import { CustomerFacade } from "../../../common/api/worker/facades/lazy/CustomerFacade"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { SyncDonePriority, SyncTracker } from "../../../common/api/main/SyncTracker"
import { assertNotNull } from "../../../../platform-kit/utils/Utils"
import { isInternalUser } from "../../../common/api/common/utils/UserUtils"
import { CustomerTypeRef } from "@tutao/entities/sys"
import { FeatureType } from "@tutao/app-env"
import { filterMailMemberships } from "../../../common/api/common/utils/IndexUtils"
import { MailBox, MailboxGroupRootTypeRef, MailBoxTypeRef } from "@tutao/entities/tutanota"
import { ImapAccountSyncStatus } from "../../../../entities/tutanota/Utils"
import { ImapImporter } from "../../workerUtils/imapimport/ImapImporter"

/**
 * continue an IMAP import tasks after login if there is one
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
		const customer = await this.entityClient.load(CustomerTypeRef, assertNotNull(user.customer))

		if (isInternalUser(user) && isCustomizationEnabledForCustomer(customer, FeatureType.ImapImport)) {
			const mailMemberships = filterMailMemberships(user)

			const mailboxesOfUser: MailBox[] = []
			for (const mailMembership of mailMemberships) {
				const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailMembership.group)
				const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
				mailboxesOfUser.push(mailbox)
			}

			await this.imapImporter.init(mailboxesOfUser)

			this.syncTracker.addSyncDoneListener({
				onSyncDone: async () => {
					for (const session of await this.imapImporter.getActiveImapImportSessions()) {
						// in case a user manually paused a sync task we do not want to continue it after login
						if (session.imapAccountSyncState.status === ImapAccountSyncStatus.PAUSED) {
							continue
						}

						const imapAccountSyncStateId = session.imapAccountSyncState._id
						try {
							await this.imapImporter.continueImport(imapAccountSyncStateId)
						} catch (e) {
							console.log(
								`failed to continue imap sync for group: ${session.imapAccountSyncState._ownerGroup}, imapAccountSyncState: ${imapAccountSyncStateId}`,
								e,
							)
						}
					}
				},
				priority: SyncDonePriority.LOW,
			})
		}
	}
}
