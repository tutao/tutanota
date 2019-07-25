// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {CustomDomainCheckResult, DnsRecordType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {DomainDnsStatus} from "./DomainDnsStatus"
import {createDnsRecordTable} from "./AddDomainDialog"

assertMainOrNode()

/**
 * @pre currentStatus.status.isLoaded() == true
 */
export function showDnsCheckDialog(currentStatus: DomainDnsStatus) {
	let renderCheckResult = function (): ChildArray {
		let result = currentStatus.getLoadedCustomDomainCheckReturn()
		if (result.checkResult === CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK) {
			let array = []
			if (result.missingRecords.length > 0 || result.invalidRecords.length > 0) {
				array.push(m(".i.mt-m.mb-s", lang.get("skipDnsRecordsInfo_msg")))

				if (result.missingRecords.filter(r => r.type !== DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC).length > 0) {
					array.push(m(".mt-m.mb-s", lang.get("setDnsRecords_msg")))
					array.push(createDnsRecordTable(result.missingRecords.filter(r => r.type !== DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC)))
				}

				if (result.invalidRecords.length > 0) {
					array.push(m(".mt-m.mb-s", lang.get("deleteDnsRecords_msg")))
					array.push(createDnsRecordTable(result.invalidRecords))
				}

				let recommendedDmarc = result.missingRecords.find(r => r.type === DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC)
				if (recommendedDmarc) {
					array.push(m(".mt-m.mb-s", lang.get("recommendedDmarcRecord_msg")))
					array.push(createDnsRecordTable([recommendedDmarc]))
				}

				array.push(m("span.small.mt-m", lang.get("moreInfo_msg") + " "))
				array.push(m("span.small", m(`a[href=${lang.getInfoLink("domainInfo_link")}][target=_blank]`, lang.getInfoLink("domainInfo_link"))))
			}
			return array
		} else {
			let errorMessageMap = {}
			errorMessageMap[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_DNS_LOOKUP_FAILED] = "customDomainErrorDnsLookupFailure_msg"
			errorMessageMap[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_DOMAIN_NOT_FOUND] = "customDomainErrorDomainNotFound_msg"
			errorMessageMap[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_NAMESERVER_NOT_FOUND] = "customDomainErrorNameserverNotFound_msg"
			return [lang.get(errorMessageMap[result.checkResult])]
		}
	}

	let dialog = Dialog.showActionDialog({
		type: DialogType.EditLarger,
		title: () => lang.get("checkDnsRecords_action"),
		okActionTextId: "checkAgain_action",
		cancelActionTextId: "close_alt",
		child: () => renderCheckResult(),
		okAction: () => {
			showProgressDialog("pleaseWait_msg", currentStatus.loadCurrentStatus()).then(() => {
				if (currentStatus.areAllRecordsFine()) {
					dialog.close()
					Dialog.error("dnsRecordsOk_msg")
				} else {
					m.redraw()
				}
			})
		},
	}).setCloseHandler(() => {
		dialog.close()
	})
}
