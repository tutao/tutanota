//@flow
import {DomainDnsStatus} from "../DomainDnsStatus"
import m from "mithril"
import type {CustomDomainCheckReturn} from "../../api/entities/sys/CustomDomainCheckReturn"
import {CustomDomainCheckResult, DnsRecordType, DnsRecordValidation} from "../../api/common/TutanotaConstants"
import {lang} from "../../misc/LanguageViewModel"
import type {AddDomainData} from "./AddDomainWizard"
import {createDnsRecordTableN} from "./AddDomainWizard"
import {Dialog} from "../../gui/base/Dialog"
import type {WizardPageAttrs} from "../../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType, WizardPageN} from "../../gui/base/WizardDialogN"
import {assertMainOrNode} from "../../api/common/Env"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import type {DnsRecord} from "../../api/entities/sys/DnsRecord"
import {BootIcons} from "../../gui/base/icons/BootIcons"

assertMainOrNode()

export class VerifyDnsRecordsPage implements WizardPageN<AddDomainData> {

	oncreate(vnode: Vnode<WizardPageAttrs<AddDomainData>>) {
		_updateDnsStatus(vnode.attrs.data)
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>): Children {
		const a = vnode.attrs
		return [
			m("h4.mt-l.text-center", lang.get("verifyDNSRecords_title")),
			m("p", lang.get("verifyDNSRecords_msg")),
			a.data.domainStatus.status.isLoaded() ? m("", [
				_renderCheckResult(a.data, a.data.domainStatus.status.getLoaded()),
				m(".flex-center.full-width.pt-l.mb-l", m("", {style: {width: "260px"}}, m(ButtonN, {
					type: ButtonType.Login,
					label: "finish_action",
					// We check if all DNS records are set correctly and let the user confirm before leaving if not
					click: () => this._finishDialog(a.data, vnode.dom)
				})))
			]) : m("", [
				lang.get("loadingDNSRecords_msg"),
				m(".flex-center.full-width.pt-l.mb-l", m(ButtonN, {
					type: ButtonType.Secondary,
					label: "refresh_action",
					click: () => _updateDnsStatus(a.data)
				}))
			])
		]
	}

	_finishDialog(data: AddDomainData, dom: ?HTMLElement): Promise<void> {
		const leaveUnfinishedDialogAttrs = {
			title: lang.get("quitSetup_title"),
			child: {
				view: () => {
					return [
						m("p", lang.get("quitDNSSetup_msg")),
					]
				}
			},
			okAction: (dialog) => {
				dialog.close()
				emitWizardEvent(dom, WizardEventType.CLOSEDIALOG)
			}
		}
		return _updateDnsStatus(data).then(() => {
			if (recordsAreFine(data.domainStatus.status.getLoaded())) {
				emitWizardEvent(dom, WizardEventType.SHOWNEXTPAGE) // The wizard will close the dialog as this is the last page
			} else {
				Dialog.showActionDialog(leaveUnfinishedDialogAttrs)
			}
		})
	}
}

function _updateDnsStatus(wizardData: AddDomainData): Promise<void> {
	wizardData.domainStatus = new DomainDnsStatus(wizardData.domain())
	return wizardData.domainStatus.loadCurrentStatus().then(() => {
		m.redraw()
	})
}

function _renderCheckResult(wizardData: AddDomainData, result: CustomDomainCheckReturn): ChildArray {
	if (result.checkResult === CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK) {
		let array = []
		let validatedRecords = result.requiredRecords.map((record) => {
			const helpInfo = []
			const validatedRecord = {}
			const missingRecords = findDnsRecordInList(record, result.missingRecords)
			missingRecords.forEach((missingRecord) => {
				validatedRecord.record = record
				if (record.type === DnsRecordType.DNS_RECORD_TYPE_TXT_DMARC) {
					helpInfo.push(`${DnsRecordValidation.BAD} ${lang.get("recommendedDNSValue_label")}: ${record.value}`)
				} else {
					helpInfo.push(`${DnsRecordValidation.BAD} ${lang.get("addDNSValue_label")}: ${record.value}`)
				}
			})
			const invalidRecords = findDnsRecordInList(record, result.invalidRecords)
			invalidRecords.forEach((invalidRecord) => {
				validatedRecord.record = record
				helpInfo.push(`${DnsRecordValidation.BAD} ${lang.get("removeDNSValue_label")}: ${invalidRecord.value}`)
			})
			if (!validatedRecord.record) {
				validatedRecord.record = record
				helpInfo.push(`${DnsRecordValidation.OK} ${lang.get("correctDNSValue_label")}`)
			}
			validatedRecord.helpInfo = helpInfo
			return validatedRecord
		})
		array.push(m(".mt-m.mb-s", lang.get("setDnsRecords_msg")))
		array.push(createDnsRecordTableN(validatedRecords, {
			label: "refresh_action",
			icon: () => BootIcons.Progress,
			click: () => _updateDnsStatus(wizardData)
		}))
		array.push(m("span.small.mt-m", lang.get("moreInfo_msg") + " "))
		array.push(m("span.small", m(`a[href=${lang.getInfoLink("domainInfo_link")}][target=_blank]`, lang.getInfoLink("domainInfo_link"))))

		return array
	} else {
		let errorMessageMap = {}
		errorMessageMap[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_DNS_LOOKUP_FAILED] = "customDomainErrorDnsLookupFailure_msg"
		errorMessageMap[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_DOMAIN_NOT_FOUND] = "customDomainErrorDomainNotFound_msg"
		errorMessageMap[CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_NAMESERVER_NOT_FOUND] = "customDomainErrorNameserverNotFound_msg"
		return [lang.get(errorMessageMap[result.checkResult])]
	}
}

function findDnsRecordInList(record: DnsRecord, recordList: Array<DnsRecord>): Array<DnsRecord> {
	return recordList.filter(r => r.type === record.type && r.subdomain === record.subdomain)
}

function recordsAreFine(result: CustomDomainCheckReturn): boolean {
	if (result.checkResult !== CustomDomainCheckResult.CUSTOM_DOMAIN_CHECK_RESULT_OK) return false
	const requiredCorrectTypes = [DnsRecordType.DNS_RECORD_TYPE_MX, DnsRecordType.DNS_RECORD_TYPE_TXT_SPF]
	const requiredMissingRecords = result.missingRecords.filter(r => requiredCorrectTypes.includes(r.type))
	return !requiredMissingRecords.length
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


	isEnabled(): boolean {return true}
}

