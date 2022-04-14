import {createMailAddressAliasServiceDataDelete} from "../../entities/sys/TypeRefs.js"
import {createMailAddressAliasServiceData} from "../../entities/sys/TypeRefs.js"
import {createDomainMailAddressAvailabilityData} from "../../entities/sys/TypeRefs.js"
import type {LoginFacadeImpl} from "./LoginFacade"
import {createMailAddressAvailabilityData} from "../../entities/sys/TypeRefs.js"
import type {MailAddressAliasServiceReturn} from "../../entities/sys/TypeRefs.js"
import {DomainMailAddressAvailabilityService, MailAddressAliasService, MailAddressAvailabilityService} from "../../entities/sys/Services.js"
import {assertWorkerOrNode} from "../../common/Env"
import {IServiceExecutor} from "../../common/ServiceRequest"

assertWorkerOrNode()

export class MailAddressFacade {
	_login: LoginFacadeImpl

	constructor(
		login: LoginFacadeImpl,
		private readonly serviceExecutor: IServiceExecutor,
	) {
		this._login = login
	}

	getAliasCounters(): Promise<MailAddressAliasServiceReturn> {
		return this.serviceExecutor.get(MailAddressAliasService, null)
	}

	isMailAddressAvailable(mailAddress: string): Promise<boolean> {
		if (this._login.isLoggedIn()) {
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