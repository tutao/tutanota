// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {CustomDomainValidationResult, DnsRecordType, DnsRecordTypeToName} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {isDomainName} from "../misc/FormatValidator"
import {TextFieldN} from "../gui/base/TextFieldN"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {showDnsCheckDialog} from "./CheckDomainDnsStatusDialog"
import {DomainDnsStatus} from "./DomainDnsStatus"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {createDnsRecord} from "../api/entities/sys/DnsRecord"

assertMainOrNode()

export function showAddDomainDialog(customerInfo: CustomerInfo, domainDnsStatus: {[key: string]: DomainDnsStatus}) {
	const domainName: Stream<string> = stream("")
	let expectedValidationRecord = createDnsRecord();
	expectedValidationRecord.type = DnsRecordType.DNS_RECORD_TYPE_TXT_SPF // not actually spf, but the type TXT only matters here
	expectedValidationRecord.subdomain = null
	expectedValidationRecord.value = "" // will be filled below very soon
	worker.getDomainValidationRecord().then(recordValue => {
		expectedValidationRecord.value = recordValue
		m.redraw()
	})

	let dialog = Dialog.showActionDialog({
		type: DialogType.EditLarger,
		title: () => lang.get("addCustomDomain_action"),
		child: () => [
			m(TextFieldN, {
				label: "adminCustomDomain_label",
				value: domainName,
			}),
			m(".mt-l", lang.get("addCustomDomainValidationRecord_msg")),
			createDnsRecordTable([expectedValidationRecord])
		],
		allowOkWithReturn: true,
		okAction: () => {
			let cleanDomainName = domainName().trim().toLowerCase()
			if (!isDomainName(cleanDomainName)) {
				Dialog.error("customDomainNeutral_msg")
			} else if (customerInfo.domainInfos.find(info => info.domain === cleanDomainName)) {
				Dialog.error("customDomainDomainAssigned_msg")
			} else {
				showProgressDialog("pleaseWait_msg", worker.addDomain(cleanDomainName).then(result => {
					if (result.validationResult === CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_OK) {
						dialog.close()
						if (!domainDnsStatus[cleanDomainName]) {
							domainDnsStatus[cleanDomainName] = new DomainDnsStatus(cleanDomainName)
							return domainDnsStatus[cleanDomainName].loadCurrentStatus().then(() => {
								if (!domainDnsStatus[cleanDomainName].areAllRecordsFine()) {
									showDnsCheckDialog(domainDnsStatus[cleanDomainName])
								}
								return null
							})
						}
						return null
					} else {
						let errorMessageMap = {}
						errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DNS_LOOKUP_FAILED] = "customDomainErrorDnsLookupFailure_msg"
						errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_FOUND] = "customDomainErrorDomainNotFound_msg"
						errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_NAMESERVER_NOT_FOUND] = "customDomainErrorNameserverNotFound_msg"
						errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE] = "customDomainErrorDomainNotAvailable_msg"
						errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_VALIDATION_FAILED] = "customDomainErrorValidationFailed_msg"
						let errorMessage = () => lang.get(errorMessageMap[result.validationResult])
							+ ((result.invalidDnsRecords.length > 0) ? " " + lang.get("customDomainErrorOtherTxtRecords_msg") + "\n"
								+ result.invalidDnsRecords.map(r => r.value).join("\n") : "")
						return errorMessage
					}
				})).then(message => {
					if (message) {
						Dialog.error(message)
					}
				})
			}
		},
	}).setCloseHandler(() => {
		dialog.close()
	})
}

export function createDnsRecordTable(records: DnsRecord[]) {
	return m(TableN, {
		columnHeading: ["type_label", "dnsRecordHostOrName_label", "dnsRecordValueOrPointsTo_label"],
		columnWidths: [ColumnWidth.Small, ColumnWidth.Small, ColumnWidth.Largest],
		showActionButtonColumn: false,
		lines: records.map(r => ({cells: [DnsRecordTypeToName[r.type], (r.subdomain ? r.subdomain : "@"), r.value]}))
	})
}
