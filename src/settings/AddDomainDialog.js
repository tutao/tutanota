// @flow
import m from "mithril"
import stream from 'mithril/stream/stream.js'
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {Dialog} from "../gui/base/Dialog"
import {CustomDomainStatusCode} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {isDomainName} from "../misc/Formatter"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"

assertMainOrNode()

export function show(customerInfo: CustomerInfo) {
	const domainName: Stream<string> = stream("")
	const domainNameAttrs: TextFieldAttrs = {
		label: "adminCustomDomain_label",
		value: domainName
	}

	let dialog = Dialog.showActionDialog({
		title: lang.get("addCustomDomain_action"),
		child: () => [
			m(TextFieldN, domainNameAttrs),
			m(".small", lang.get("adminCustomDomainInfo_msg")),
			m(".small", m(`a[href=${lang.getInfoLink("domainInfo_link")}][target=_blank]`, lang.getInfoLink("domainInfo_link"))),
		],
		okAction: () => {
			let cleanDomainName = domainName().trim().toLowerCase()
			if (!isDomainName(cleanDomainName)) {
				Dialog.error("customDomainNeutral_msg")
			} else if (customerInfo.domainInfos.find(info => info.domain === cleanDomainName)) {
				Dialog.error("customDomainDomainAssigned_msg")
			} else {
				worker.addDomain(cleanDomainName).then(status => {
					if (status.statusCode === CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_OK) {
						dialog.close()
					} else {
						let errorMessageId
						if (status.statusCode === CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_DNS_LOOKUP_FAILED) {
							errorMessageId = "customDomainErrorDnsLookupFailure_msg"
						} else if (status.statusCode
							=== CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_INVALID_DNS_RECORD) {
							errorMessageId = "customDomainErrorInvalidDnsRecord_msg"
						} else if (status.statusCode
							=== CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_MISSING_MX_RECORD) {
							errorMessageId = "customDomainErrorMissingMxEntry_msg"
						} else if (status.statusCode
							=== CustomDomainStatusCode.CUSTOM_DOMAIN_STATUS_MISSING_SPF_RECORD) {
							errorMessageId = "customDomainErrorMissingSpfEntry_msg"
						} else {
							errorMessageId = "customDomainErrorDomainNotAvailable_msg"
						}
						Dialog.error(() => lang.get(errorMessageId) + "\n"
							+ status.invalidDnsRecords.map(r => r.value).join("\n"))
					}
				})
			}
		}
	})
}
