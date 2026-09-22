import { DomainDnsStatus } from "../DomainDnsStatus"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import { CustomDomainCheckResult, DnsRecordType, DnsRecordValidation, EnvProvider } from "../../../../platform-kit/app-env"
import { InfoLink, lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import type { AddDomainData } from "./AddDomainWizard"
import { ActionDialogProps, Dialog } from "../../../../ui/base/Dialog"
import type { WizardPageAttrs } from "../../../../ui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import { Button, ButtonType } from "../../../../ui/base/Button.js"
import { downcast } from "../../../../platform-kit/utils"
import { ButtonSize } from "../../../../ui/base/ButtonSize.js"
import { renderDnsRecordsCard } from "./DnsRecordTable.js"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons.js"
import { MoreInfoLink } from "../../../common/misc/news/MoreInfoLink.js"
import { Icons } from "../../../../ui/base/icons/Icons"
import { assertEnumValue } from "../../../../platform-kit/meta"
import { DnsRecord } from "@tutao/entities/sys"
import { TitleSection } from "../../../../ui/TitleSection.js"
import { theme } from "../../../../ui/theme"
import { px, size } from "../../../../ui/size"

EnvProvider.assertMainOrNode()

/** Wizard page which can verify DNS records for custom email domain. */
export class VerifyDnsRecordsPage implements WizardPageN<AddDomainData> {
	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddDomainData>>) {
		const data = vnode.attrs.data
		data.domainStatus = new DomainDnsStatus(data.domain())

		_updateDnsStatus(data.domainStatus)
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>) {
		const a = vnode.attrs
		return m(".mt-24", [
			m(TitleSection, {
				icon: Icons.GlobeFilled,
				iconOptions: { color: theme.on_surface_variant },
				title: lang.get("verifyDNSRecords_title"),
				subTitle: lang.get("verifyDNSRecords_msg"),
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			}),
			a.data.domainStatus.status.isLoaded()
				? m("", [
						renderCheckResult(a.data.domainStatus),
						m(
							".flex-end.full-width.pt-32.mb-32",
							m(
								"",
								{ style: { width: "260px" } },
								m(PrimaryButton, {
									label: "finish_action",
									class: "wizard-next-button",
									// We check if all DNS records are set correctly and let the user confirm before leaving if not
									onclick: () => this._finishDialog(a.data, (downcast<VnodeDOM>(vnode)?.dom as HTMLElement | null) ?? null),
								}),
							),
						),
					])
				: m(".mt-16", [
						lang.get("loadingDNSRecords_msg"),
						m(
							".flex-end.full-width.pt-32.mb-32",
							m(Button, {
								type: ButtonType.Secondary,
								label: "refresh_action",
								click: () => _updateDnsStatus(a.data.domainStatus),
							}),
						),
					]),
		])
	}

	_finishDialog(data: AddDomainData, dom: HTMLElement | null): Promise<void> {
		const leaveUnfinishedDialogAttrs: ActionDialogProps = {
			title: "quitSetup_title",
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
			renderDnsRecordsCard(validatedRecords, {
				titleText: lang.get("setDnsRecords_msg"),
				refreshButtonAttrs: hideRefreshButton
					? null
					: {
							label: "refresh_action",
							icon: Icons.Sync,
							size: ButtonSize.Compact,
							click: () => _updateDnsStatus(domainStatus),
						},
			}),
			m(MoreInfoLink, { link: InfoLink.DomainInfo, class: "mt-12", isSmall: true }),
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

	headerTitle(): TranslationKey {
		return "domainSetup_title"
	}

	stepTitle = "domainSetupStepDns_title" as TranslationKey

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
