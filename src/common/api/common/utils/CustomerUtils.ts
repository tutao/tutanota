import { Customer, CustomerInfo, DomainInfo } from "../../entities/sys/TypeRefs.js"
import { FeatureType } from "../TutanotaConstants.js"

export function getWhitelabelDomainInfo(customerInfo: CustomerInfo, domainName?: string): DomainInfo | null {
	return customerInfo.domainInfos.find((info) => info.whitelabelConfig != null && (domainName == null || info.domain === domainName)) ?? null
}

export function getCustomMailDomains(customerInfo: CustomerInfo): Array<DomainInfo> {
	return customerInfo.domainInfos.filter((di) => di.whitelabelConfig == null)
}

export function isCustomizationEnabledForCustomer(customer: Customer, feature: FeatureType): boolean {
	return customer.customizations.some((customization) => customization.feature === feature)
}
