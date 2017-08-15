// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Dialog} from "../gui/base/Dialog"
import {CustomDomainStatusCode} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {isDomainName} from "../misc/Formatter"

assertMainOrNode()

export function show(customerInfo: CustomerInfo) {
	let domainName = new TextField("adminCustomDomain_label")
	let form = {
		view: () => {
			return [
				m(domainName),
				m(".small", lang.get("adminCustomDomainInfo_msg")),
				m(".small", m(`a[href=${getDomainInfoLink()}][target=_blank]`, getDomainInfoLink())),
			]
		}
	}
	let dialog = Dialog.smallActionDialog(lang.get("addCustomDomain_action"), form, () => {
		let cleanDomainName = domainName.value().trim().toLowerCase()
		if (!isDomainName(cleanDomainName)) {
			Dialog.error("customDomainNeutral_msg")
		} else if (customerInfo.domainInfos.find(info => info.domain == cleanDomainName)) {
			Dialog.error("customDomainDomainAssigned_msg")
		} else {
			worker.addDomain(cleanDomainName).then(status => {
				if (status.statusCode == CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_OK) {
					dialog.close()
				} else {
					let errorMessageId
					if (status.statusCode == CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_DNS_LOOKUP_FAILED) {
						errorMessageId = "customDomainErrorDnsLookupFailure_msg"
					} else if (status.statusCode == CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_INVALID_DNS_RECORD) {
						errorMessageId = "customDomainErrorInvalidDnsRecord_msg"
					} else if (status.statusCode == CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_MISSING_MX_RECORD) {
						errorMessageId = "customDomainErrorMissingMxEntry_msg"
					} else if (status.statusCode == CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_MISSING_SPF_RECORD) {
						errorMessageId = "customDomainErrorMissingSpfEntry_msg"
					} else {
						errorMessageId = "customDomainErrorDomainNotAvailable_msg"
					}
					Dialog.error(() => lang.get(errorMessageId) + "\n" + status.invalidDnsRecords.map(r => r.value).join("\n"))
				}
			})
		}
	})
}

export function getDomainInfoLink(): string {
	return lang.code == "de" ? "https://tutanota.uservoice.com/knowledgebase/articles/666070" : "https://tutanota.uservoice.com/knowledgebase/articles/666088"
}
