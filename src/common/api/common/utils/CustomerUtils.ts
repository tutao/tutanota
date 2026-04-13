import { sysTypeRefs } from "@tutao/typeRefs"
import { FeatureType } from "@tutao/appEnv"

export function getWhitelabelDomainInfo(customerInfo: sysTypeRefs.CustomerInfo, domainName?: string): sysTypeRefs.DomainInfo | null {
	return customerInfo.domainInfos.find((info) => info.whitelabelConfig != null && (domainName == null || info.domain === domainName)) ?? null
}

export function getCustomMailDomains(customerInfo: sysTypeRefs.CustomerInfo): Array<sysTypeRefs.DomainInfo> {
	return customerInfo.domainInfos.filter((di) => di.whitelabelConfig == null)
}

export function isCustomizationEnabledForCustomer(customer: sysTypeRefs.Customer, feature: FeatureType): boolean {
	return customer.customizations.some((customization) => customization.feature === feature)
}
