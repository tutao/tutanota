import type {MailAddressAliasServiceReturn} from "../../entities/sys/TypeRefs.js"
import {
	createDomainMailAddressAvailabilityData,
	createMailAddressAliasServiceData,
	createMailAddressAliasServiceDataDelete,
	createMailAddressAvailabilityData
} from "../../entities/sys/TypeRefs.js"
import {DomainMailAddressAvailabilityService, MailAddressAliasService, MailAddressAvailabilityService} from "../../entities/sys/Services.js"
import {assertWorkerOrNode} from "../../common/Env"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {UserFacade} from "./UserFacade"

assertWorkerOrNode()

export class MailAddressFacade {
	constructor(
		private readonly user: UserFacade,
		private readonly serviceExecutor: IServiceExecutor,
	) {
	}

	getAliasCounters(): Promise<MailAddressAliasServiceReturn> {
		return this.serviceExecutor.get(MailAddressAliasService, null)
	}

	isMailAddressAvailable(mailAddress: string): Promise<boolean> {
		if (this.user.isFullyLoggedIn()) {
			const data = createDomainMailAddressAvailabilityData({mailAddress})
			return this.serviceExecutor.get(DomainMailAddressAvailabilityService, data)
					   .then(result => result.available)
		} else {
			const data = createMailAddressAvailabilityData({mailAddress})
			return this.serviceExecutor.get(MailAddressAvailabilityService, data)
					   .then(result => result.available)
		}
	}

	async addMailAlias(groupId: Id, alias: string): Promise<void> {
		const data = createMailAddressAliasServiceData({
			group: groupId,
			mailAddress: alias,
		})
		await this.serviceExecutor.post(MailAddressAliasService, data)
	}

	async setMailAliasStatus(groupId: Id, alias: string, restore: boolean): Promise<void> {
		const deleteData = createMailAddressAliasServiceDataDelete({
			mailAddress: alias,
			restore,
			group: groupId,
		})
		await this.serviceExecutor.delete(MailAddressAliasService, deleteData)
	}
}