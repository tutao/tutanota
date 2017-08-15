// @flow
import {assertWorkerOrNode} from "../../Env"
import {createMailAddressAliasServiceDataDelete} from "../../entities/sys/MailAddressAliasServiceDataDelete"
import {_service} from "../rest/ServiceRestClient"
import {HttpMethod} from "../../common/EntityFunctions"
import {createMailAddressAliasServiceData} from "../../entities/sys/MailAddressAliasServiceData"
import {createDomainMailAddressAvailabilityData} from "../../entities/sys/DomainMailAddressAvailabilityData"
import {loginFacade} from "./LoginFacade"
import {createMailAddressAvailabilityData} from "../../entities/sys/MailAddressAvailabilityData"
import {DomainMailAddressAvailabilityReturnTypeRef} from "../../entities/sys/DomainMailAddressAvailabilityReturn"
import {MailAddressAvailabilityReturnTypeRef} from "../../entities/sys/MailAddressAvailabilityReturn"
import {MailAddressAliasServiceReturnTypeRef} from "../../entities/sys/MailAddressAliasServiceReturn"
import {SysService} from "../../entities/sys/Services"

assertWorkerOrNode()

export class MailAddressFacade {

	constructor() {

	}

	getAliasCounters(): Promise<MailAddressAliasServiceReturn> {
		return _service(SysService.MailAddressAliasService, HttpMethod.GET, null, MailAddressAliasServiceReturnTypeRef)
	}

	isMailAddressAvailable(mailAddress: string): Promise<boolean> {
		if (loginFacade.isLoggedIn()) {
			let data = createDomainMailAddressAvailabilityData()
			data.mailAddress = mailAddress
			return _service(SysService.DomainMailAddressAvailabilityService, HttpMethod.GET, data, DomainMailAddressAvailabilityReturnTypeRef).then(result => result.available)
		} else {
			let data = createMailAddressAvailabilityData()
			data.mailAddress = mailAddress
			return _service(SysService.MailAddressAvailabilityService, HttpMethod.GET, data, MailAddressAvailabilityReturnTypeRef).then(result => result.available)
		}
	}

	addMailAlias(groupId: Id, alias: string): Promise<void> {
		let data = createMailAddressAliasServiceData()
		data.group = groupId
		data.mailAddress = alias
		return _service(SysService.MailAddressAliasService, HttpMethod.POST, data)
	}

	setMailAliasStatus(groupId: Id, alias: string, restore: boolean): Promise<void> {
		let deleteData = createMailAddressAliasServiceDataDelete()
		deleteData.mailAddress = alias
		deleteData.restore = restore
		deleteData.group = groupId
		return _service(SysService.MailAddressAliasService, HttpMethod.DELETE, deleteData)
	}
}

export const mailAddressAliasFacade: MailAddressFacade = new MailAddressFacade()
