import {
	CustomerMigrationInfo,
	CustomerMigrationInfoTypeRef,
	CustomerUserMigrationInfoTypeRef,
	GroupInfoTypeRef,
	GroupTypeRef,
	MailboxMigrationInfo,
	MailboxMigrationInfoTypeRef,
} from "@tutao/entities/sys"
import { idToElementId, OperationType } from "@tutao/meta"
import { promiseMap } from "@tutao/utils"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { generatedIdToTimestamp } from "../../../../platform-kit/meta/EntityUtils"
import { CustomerMailboxMigrationInfoStatus, CustomerMigrationInfoStatus } from "../../../../entities/tutanota/Utils"
import { CustomerMigrationFacade } from "../../../common/api/worker/facades/lazy/CustomerMigrationFacade"
import { LoginController } from "../../../common/api/main/LoginController"
import { MigrationMailboxRowView } from "./MigrationMailboxTableRow"

export type MigrationBatchView = {
	id: IdTuple
	status: CustomerMigrationInfoStatus
	startedAt: number
	rows: MigrationMailboxRowView[]
}

type LoadedBatch = {
	view: MigrationBatchView
	/** Ids of all the lists (customer user infos, mailbox infos) the batch was built from, to map entity updates back to the batch. */
	listIds: ReadonlySet<Id>
}

/** Holds the data rendered by the {@link MigrationViewer} and keeps it up to date with entity updates. */
export class MigrationViewerModel {
	private batchesById: Map<Id, LoadedBatch> = new Map()
	private _batches: MigrationBatchView[] = []
	private _loading = true

	constructor(
		private readonly customerMigrationFacade: CustomerMigrationFacade,
		private readonly entityClient: EntityClient,
		private readonly loginController: LoginController,
	) {}

	get batches(): ReadonlyArray<MigrationBatchView> {
		return this._batches
	}

	get loading(): boolean {
		return this._loading
	}

	async init(): Promise<void> {
		this._loading = true
		try {
			await this.reloadAllBatches()
		} finally {
			this._loading = false
		}
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		const batchesToReload = new Set<Id>()
		let reloadAll = false

		for (const update of updates) {
			if (isUpdateForTypeRef(CustomerMigrationInfoTypeRef, update)) {
				if (update.operation === OperationType.DELETE) {
					this.batchesById.delete(update.instanceId)
					batchesToReload.delete(update.instanceId)
				} else {
					batchesToReload.add(update.instanceId)
				}
			} else if (isUpdateForTypeRef(CustomerUserMigrationInfoTypeRef, update) || isUpdateForTypeRef(MailboxMigrationInfoTypeRef, update)) {
				const batchId = this.findBatchIdForList(update.instanceListId)
				if (batchId != null) {
					batchesToReload.add(batchId)
				} else if (update.operation !== OperationType.DELETE) {
					// we do not know the list yet, so we cannot tell which batch this belongs to
					reloadAll = true
				}
			}
		}

		if (reloadAll) {
			await this.reloadAllBatches()
		} else {
			for (const batchId of batchesToReload) {
				await this.reloadBatch(batchId)
			}
			this.computeBatches()
		}
	}

	private findBatchIdForList(listId: Id | null): Id | null {
		if (listId == null) return null
		for (const [batchId, { listIds }] of this.batchesById) {
			if (listIds.has(listId)) return batchId
		}
		return null
	}

	private computeBatches() {
		this._batches = Array.from(this.batchesById.values(), ({ view }) => view).sort((a, b) => a.startedAt - b.startedAt)
	}

	private async reloadBatch(batchId: Id): Promise<void> {
		const customerInfo = await this.loginController.getUserController().loadCustomerInfo()
		if (customerInfo.migrationInfos == null) return
		const batch = await this.entityClient.load(CustomerMigrationInfoTypeRef, [customerInfo.migrationInfos, batchId])
		this.batchesById.set(batchId, await this.loadBatch(batch))
	}

	private async reloadAllBatches(): Promise<void> {
		const customerInfo = await this.loginController.getUserController().loadCustomerInfo()
		const batches: CustomerMigrationInfo[] = customerInfo.migrationInfos
			? await this.entityClient.loadAll(CustomerMigrationInfoTypeRef, customerInfo.migrationInfos)
			: []
		const loaded = await promiseMap(batches, (batch) => this.loadBatch(batch))
		this.batchesById = new Map(loaded.map((loadedBatch) => [loadedBatch.view.id[1], loadedBatch]))
		this.computeBatches()
	}

	private async loadBatch(batch: CustomerMigrationInfo): Promise<LoadedBatch> {
		const listIds = new Set<Id>([batch.customerUserMigrationInfos, batch.customerMailboxMigrationInfos])

		const customerUserMigrationInfos = await this.entityClient.loadAll(CustomerUserMigrationInfoTypeRef, batch.customerUserMigrationInfos)
		const userRowsPerUser = await promiseMap(customerUserMigrationInfos, async (customerUserMigrationInfo) => {
			listIds.add(customerUserMigrationInfo.mailboxMigrationInfos)
			const mailboxInfos: MailboxMigrationInfo[] = await this.entityClient.loadAll(
				MailboxMigrationInfoTypeRef,
				customerUserMigrationInfo.mailboxMigrationInfos,
			)

			const sourceMailAddress = await this.customerMigrationFacade.getSourceMailAddressForUserMailbox(customerUserMigrationInfo, batch)
			return mailboxInfos.map(
				(info): MigrationMailboxRowView => ({
					name: customerUserMigrationInfo.tutaName,
					tutaMailAddress: customerUserMigrationInfo.tutaMailAddress,
					sourceMailAddress: sourceMailAddress ?? "",
					status: info.status as CustomerMailboxMigrationInfoStatus,
					initialPassword: customerUserMigrationInfo.initialPassword,
					errorCode: info.errorCode,
				}),
			)
		})

		const sharedMailboxInfos: MailboxMigrationInfo[] = await this.entityClient.loadAll(MailboxMigrationInfoTypeRef, batch.customerMailboxMigrationInfos)
		const sharedRows = await promiseMap(sharedMailboxInfos, async (info): Promise<MigrationMailboxRowView> => {
			const group = await this.entityClient.load(GroupTypeRef, idToElementId(info.mailGroup))
			const groupInfo = await this.entityClient.load(GroupInfoTypeRef, group.groupInfo)
			const sourceMailAddress = await this.customerMigrationFacade.getSourceMailAddressForSharedMailbox(info)
			return {
				name: groupInfo.name,
				tutaMailAddress: groupInfo.mailAddress ?? "",
				sourceMailAddress: sourceMailAddress ?? "",
				status: info.status as CustomerMailboxMigrationInfoStatus,
				initialPassword: null,
				errorCode: info.errorCode,
			}
		})

		return {
			view: {
				id: batch._id,
				status: batch.status as CustomerMigrationInfoStatus,
				startedAt: generatedIdToTimestamp(batch._id[1]),
				rows: [...userRowsPerUser.flat(), ...sharedRows],
			},
			listIds,
		}
	}
}
