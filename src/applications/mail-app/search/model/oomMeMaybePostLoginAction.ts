import { LoggedInEvent, PostLoginAction } from "../../../../app-kit/native-bridge/common/PostLoginAction"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { SyncTracker } from "../../../common/api/main/SyncTracker"
import { LoginController } from "../../../common/api/main/LoginController"
import { SessionType } from "@tutao/app-env"
import { CacheSyncStatus, ListenerPriority } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { MailboxGroupRootTypeRef, MailBoxTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { GENERATED_MAX_ID, getElementId, idToElementId } from "@tutao/meta"
import { assertNotNull, last } from "@tutao/utils"
import { NotAuthorizedError } from "@tutao/rest-client/error"

const TAG = "LeakMemoryPostLoginAction"

export class oomMeMaybePostLoginAction implements PostLoginAction {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly syncTracker: SyncTracker,
		private readonly login: LoginController,
	) {}

	async onPartialLoginSuccess(_: LoggedInEvent): Promise<void> {}

	async onFullLoginSuccess(event: LoggedInEvent): Promise<void> {
		if (event.sessionType === SessionType.Persistent) {
			this.syncTracker.addSyncListener({
				id: TAG,
				priority: ListenerPriority.HIGH,
				targetStatus: CacheSyncStatus.OnlineSyncDone,
				onSyncStatusChange: async () => {
					performance.mark("leaking-start")
					console.log(TAG, "loading mails start")

					const mailGroups = this.login.getUserController().getMailGroupMemberships()
					for (const mailGroup of mailGroups) {
						const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(mailGroup.group))
						const mailbox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailboxGroupRoot.mailbox))
						const allMailBags = [assertNotNull(mailbox.currentMailBag), ...mailbox.archivedMailBags].map((a) => a.mails)

						for (const mailList of allMailBags) {
							console.log(TAG, "loading mailbag: ", mailList)
							performance.mark("loading-mailbag-start")

							let startId = GENERATED_MAX_ID
							try {
								while (true) {
									const mails = await this.entityClient.loadRange(MailTypeRef, mailList, startId, 1000, true)
									if (mails.length < 1000) {
										break
									}

									startId = getElementId(assertNotNull(last(mails)))
								}
							} catch (e) {
								if (e instanceof NotAuthorizedError) {
									console.warn("NotAuthorized: ", e)
									return
								} else {
									throw e
								}
							}

							performance.mark("loading-mailbag-end")
						}
					}

					console.log(TAG, "loading mails end")
					performance.mark("leaking-end")
				},
			})
		}
	}
}
