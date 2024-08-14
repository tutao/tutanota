import { AccountType, TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS } from "../../api/common/TutanotaConstants.js"
import { LoginController } from "../../api/main/LoginController.js"
import { getCustomMailDomains } from "../../api/common/utils/CustomerUtils.js"

export interface EmailDomainData {
	domain: string
	isPaid: boolean
}

export async function getAvailableDomains(logins: LoginController, onlyCustomDomains?: boolean): Promise<EmailDomainData[]> {
	const customerInfo = await logins.getUserController().loadCustomerInfo()
	let availableDomains = getCustomMailDomains(customerInfo).map((info) => info.domain)

	if (
		!onlyCustomDomains &&
		logins.getUserController().user.accountType !== AccountType.STARTER &&
		(availableDomains.length === 0 || logins.getUserController().isGlobalAdmin())
	) {
		availableDomains.push(...TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS)
	}

	return availableDomains.map((domain) => ({ domain, isPaid: isPaidPlanDomain(domain) }))
}

export function isPaidPlanDomain(domain: String): boolean {
	return domain === "tuta.com"
}
