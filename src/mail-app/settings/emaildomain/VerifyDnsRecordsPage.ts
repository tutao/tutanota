import { DomainDnsStatus } from "../DomainDnsStatus"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { assertEnumValue, CustomDomainCheckResult, DnsRecordType, DnsRecordValidation } from "../../../common/api/common/TutanotaConstants"
import { InfoLink, lang, TranslationKey } from "../../../common/misc/LanguageViewModel"
import type { AddDomainData, ValidatedDnSRecord } from "./AddDomainWizard"
import { Dialog } from "../../../common/gui/base/Dialog"
import type { WizardPageAttrs } from "../../../common/gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType, WizardPageN } from "../../../common/gui/base/WizardDialog.js"
import { Button, ButtonType } from "../../../common/gui/base/Button.js"
import type { DnsRecord } from "../../../common/api/entities/sys/TypeRefs.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { downcast } from "@tutao/tutanota-utils"
import { ButtonSize } from "../../../common/gui/base/ButtonSize.js"
import { IconButtonAttrs } from "../../../common/gui/base/IconButton.js"
import { ColumnWidth, Table } from "../../../common/gui/base/Table.js"
import { DnsRecordTable } from "./DnsRecordTable.js"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton.js"
import { MoreInfoLink } from "../../../common/misc/news/MoreInfoLink.js"

assertMainOrNode()

/** Wizard page which can verify DNS records for custom email domain. */
export class VerifyDnsRecordsPage implements WizardPageN<AddDomainData> {
	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddDomainData>>) {
		const data = vnode.attrs.data
		data.domainStatus = new DomainDnsStatus(data.domain())

		_updateDnsStatus(data.domainStatus)
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>) {
		const a = vnode.attrs
		return [
			m("h4.mt-l.text-center", lang.get("verifyDNSRecords_title")),
			m("p", lang.get("verifyDNSRecords_msg")),
			a.data.domainStatus.status.isLoaded()
				? m("", [
						renderCheckResult(a.data.domainStatus),
						m(
							".flex-center.full-width.pt-l.mb-l",
							m(
								"",
								{
									style: {
										width: "260px",
									},
								},
								m(LoginButton, {
									label: "finish_action",
									// We check if all DNS records are set correctly and let the user confirm before leaving if not
									onclick: () => this._finishDialog(a.data, (downcast<VnodeDOM>(vnode)?.dom as HTMLElement | null) ?? null),
								}),
							),
						),
				  ])
				: m("", [
						lang.get("loadingDNSRecords_msg"),
						m(
							".flex-center.full-width.pt-l.mb-l",
							m(Button, {
								type: ButtonType.Secondary,
								label: "refresh_action",
								click: () => _updateDnsStatus(a.data.domainStatus),
							}),
						),
				  ]),
		]
	}

	_finishDialog(data: AddDomainData, dom: HTMLElement | null): Promise<void> {
		const leaveUnfinishedDialogAttrs = {
			title: lang.get("quitSetup_title"),
			child: {
				view: () => {
					return [m("p", lang.get("quitDNSSetup_msg"))]
				},
			},
			okAction: (dialog: Dialog) => {
				dialog.close()
				emitWizardEvent(dom, WizardEventType.CLOSE_DIALOG)
			},
		}
		return _updateDnsStatus(data.domainStatus).then(() => {
			if (data.domainStatus.areRecordsFine()) {
				emitWizardEvent(dom, WizardEventType.SHOW_NEXT_PAGE) // The wizard will close the dialog as this is the last page
			} else {
				Dialog.showActionDialog(leaveUnfinishedDialogAttrs)
			}
		})
	}
}

function _updateDnsStatus(domainStatus: DomainDnsStatus): Promise<void> {
	return domainStatus.loadCurrentStatus().then(() => {
		m.redraw()
	})
}

function _getDisplayableRecordValue(record: DnsRecord): string {
	if (
		!record.value.endsWith(".") &&
		(record.type === DnsRecordType.DNS_RECORD_TYPE_MX ||
			record.type === DnsRecordType.DNS_RECORD_TYPE_CNAME_DKIM ||
			record.type === DnsRecordType.DNS_RECORD_TYPE_CNAME_MTA_STS)
	) {
		return record.value + "."
	}

	return record.value
}

export function createDnsRecordTableN(records: ValidatedDnSRecord[], refreshButtonAttrs: IconButtonAttrs | null): Children {
	return m(Table, {
		columnHeading: ["type_label", "dnsRecordHostOrName_label", "dnsRecordValueOrPointsTo_label"],
		addButtonAttrs: refreshButtonAttrs,
		columnWidths: [ColumnWidth.Small, ColumnWidth.Small, ColumnWidth.Largest],
		showActionButtonColumn: true,
		lines: records.map((r) => {
			return {
				cells: () => [
					{
						main: DnsRecordTable[r.record.type as DnsRecordType],
					},
					{
						main: r.record.subdomain ? r.record.subdomain : "@",
					},
					{
						main: r.record.value,
						info: r.helpInfo,
					},
				],
			}
		}),
	})
}

export function renderCheckResult(domainStatus: DomainDnsStatus, hideRefreshButton: boolean = false): Children {
	const checkReturn = domainStatus.getLoadedCustomDomainCheckGetOut()
	const { requiredRecords, missingRecords, invalidRecords } = checkReturn
	const checkResult = assertEnumValue(CustomDomainCheckResult, checkReturn.checkResult)

	if (checkResult === CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK) {
		const validatedRecords = requiredRecords.map((record) => {
			const displayableRecordValue = _getDisplayableRecordValue(record)

			const helpInfo: string[] = []
			let validatedRecord: DnsRecord | null = null

			for (let missingRecord of findDnsRecordInList(record, missingRecords)) {
				validatedRecord = record

				if (record.type === DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC) {
					helpInfo.push(`${DnsRecordValidation.BAD} ${lang.get("recommendedDNSValue_label")}: ${displayableRecordValue}`)
				} else {
					helpInfo.push(`${DnsRecordValidation.BAD} ${lang.get("addDNSValue_label")}: ${displayableRecordValue}`)
				}
			}

			for (let invalidRecord of findDnsRecordInList(record, invalidRecords)) {
				validatedRecord = record
				// here we want to display the incorrect value!
				helpInfo.push(`${DnsRecordValidation.BAD} ${lang.get("removeDNSValue_label")}: ${invalidRecord.value}`)
			}

			if (validatedRecord == null) {
				validatedRecord = record
				helpInfo.push(`${DnsRecordValidation.OK} ${lang.get("correctDNSValue_label")}`)
			}

			validatedRecord.value = displayableRecordValue
			return {
				record: validatedRecord,
				helpInfo,
			}
		})
		return [
			m(".mt-m.mb-s", lang.get("setDnsRecords_msg")),
			createDnsRecordTableN(
				validatedRecords,
				hideRefreshButton
					? null
					: {
							title: "refresh_action",
							icon: BootIcons.Progress,
							size: ButtonSize.Compact,
							click: () => _updateDnsStatus(domainStatus),
					  },
			),
			m(MoreInfoLink, { link: InfoLink.DomainInfo, class: "mt-m", isSmall: true }),
		]
	} else {
		const errorMessageMap: Record<CustomDomainCheckResult, TranslationKey> = {
			[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK]: "emptyString_msg",
			[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_DNS_LOOKUP_FAILED]: "customDomainErrorDnsLookupFailure_msg",
			[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_DOMAIN_NOT_FOUND]: "customDomainErrorDomainNotFound_msg",
			[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_NAMESERVER_NOT_FOUND]: "customDomainErrorNameserverNotFound_msg",
		}
		return lang.get(errorMessageMap[checkResult])
	}
}

function findDnsRecordInList(record: DnsRecord, recordList: Array<DnsRecord>): Array<DnsRecord> {
	return recordList.filter((r) => r.type === record.type && r.subdomain === record.subdomain)
}

export class VerifyDnsRecordsPageAttrs implements WizardPageAttrs<AddDomainData> {
	data: AddDomainData

	constructor(domainData: AddDomainData) {
		this.data = domainData
	}

	headerTitle(): string {
		return lang.get("domainSetup_title")
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		// No need to do anything, as we are leaving the wizard
		// The gui component will display a confirmation dialog if DNS configuration is not ok.
		// So it is ok not to have this dialog when called from elsewhere.
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
