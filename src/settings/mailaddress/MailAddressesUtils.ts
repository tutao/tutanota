import { CustomerInfoTypeRef, CustomerTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { getCustomMailDomains } from "../../api/common/utils/Utils.js"
import { AccountType, TUTANOTA_MAIL_ADDRESS_DOMAINS } from "../../api/common/TutanotaConstants.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { LoginController } from "../../api/main/LoginController.js"
import { addAll, neverNull } from "@tutao/tutanota-utils"

export function getAvailableDomains(entityClient: EntityClient, logins: LoginController, onlyCustomDomains?: boolean): Promise<string[]> {
	return entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then((customer) => {
		return entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then((customerInfo) => {
			let availableDomains = getCustomMailDomains(customerInfo).map((info) => info.domain)

			if (
				!onlyCustomDomains &&
				logins.getUserController().user.accountType !== AccountType.STARTER &&
				(availableDomains.length === 0 || logins.getUserController().isGlobalAdmin())
			) {
				addAll(availableDomains, TUTANOTA_MAIL_ADDRESS_DOMAINS)
			}

			return availableDomains
		})
	})
}
