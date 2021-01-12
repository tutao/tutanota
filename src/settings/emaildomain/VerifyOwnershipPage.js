//@flow
import {CustomDomainValidationResult} from "../../api/common/TutanotaConstants"
import m from "mithril"
import type {AddDomainData} from "./AddDomainWizard"
import {createDnsRecordTable} from "./AddDomainWizard"
import {worker} from "../../api/main/WorkerClient"
import {showProgressDialog} from "../../gui/ProgressDialog"
import {lang} from "../../misc/LanguageViewModel"
import {Dialog} from "../../gui/base/Dialog"
import {getCustomMailDomains} from "../../api/common/utils/Utils"
import type {WizardPageAttrs, WizardPageN} from "../../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../../gui/base/WizardDialogN"
import {assertMainOrNode} from "../../api/common/Env"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {PreconditionFailedError} from "../../api/common/error/RestError"
import {showBusinessFeatureRequiredDialog} from "../../subscription/SubscriptionDialogUtils"

assertMainOrNode()


const FAILURE_CUSTOM_DOMAIN_LIMIT_REACHED = "customdomain.limit_reached"

export class VerifyOwnershipPage implements WizardPageN<AddDomainData> {

	oncreate(vnode: Vnode<WizardPageAttrs<AddDomainData>>) {
		worker.getDomainValidationRecord().then(recordValue => {
			vnode.attrs.data.expectedVerificationRecord.value = recordValue
			m.redraw()
		})
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>): Children {
		const a = vnode.attrs
		return [
			m("h4.mt-l.text-center", lang.get("verifyDomainOwnership_title")),
			m("p", lang.get("verifyDomainOwnershipExplanation_msg", {
				"{domain}": a.data.domain(),
			})),
			m("p", lang.get("verifyOwnershipTXTrecord_msg")),
			createDnsRecordTable([vnode.attrs.data.expectedVerificationRecord]),
			m(".flex-center.full-width.pt-l.mb-l", m("", {style: {width: "260px"}}, m(ButtonN, {
				type: ButtonType.Login,
				label: "next_action",
				click: () => emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
			})))
		]
	}
}

export class VerifyOwnershipPageAttrs implements WizardPageAttrs<AddDomainData> {

	data: AddDomainData

	constructor(domainData: AddDomainData) {
		this.data = domainData
	}

	headerTitle(): string {
		return lang.get("domainSetup_title")
	}

	nextAction(showErrorDialog: boolean = true): Promise<boolean> {
		return showProgressDialog("pleaseWait_msg", worker.addDomain(this.data.domain()).then((result) => {
				if (result.validationResult === CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_OK) {
					return null
				} else if (result.validationResult === CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE) {
					let customDomainInfos = getCustomMailDomains(this.data.customerInfo)
					//domain is already assigned to this account
					if (customDomainInfos.filter((domainInfo) => domainInfo.domain === this.data.domain()).length) {
						return null
					}
					return () => lang.get("customDomainErrorDomainNotAvailable_msg")
				} else {
					let errorMessageMap = {}
					errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DNS_LOOKUP_FAILED] = "customDomainErrorDnsLookupFailure_msg"
					errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_FOUND] = "customDomainErrorDomainNotFound_msg"
					errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_NAMESERVER_NOT_FOUND] = "customDomainErrorNameserverNotFound_msg"
					errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE] = "customDomainErrorDomainNotAvailable_msg"
					errorMessageMap[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_VALIDATION_FAILED] = "customDomainErrorValidationFailed_msg"
					return () => lang.get(errorMessageMap[result.validationResult])
						//TODO correct to use? customDomainErrorOtherTxtRecords_msg
						+ ((result.invalidDnsRecords.length > 0) ? " " + lang.get("customDomainErrorOtherTxtRecords_msg") + "\n"
							+ result.invalidDnsRecords.map(r => r.value).join("\n") : "")
				}
			}
		)).then((message) => {
			if (message) {
				return showErrorDialog ? Dialog.error(message).then(() => false) : false
			}
			return true
		}).catch(PreconditionFailedError, e => {
			if (e.data === FAILURE_CUSTOM_DOMAIN_LIMIT_REACHED) {
				// ignore promise. always return false to not switch to next page.
				showBusinessFeatureRequiredDialog("businessFeatureRequiredMultipleDomains_msg")
			} else {
				Dialog.error(() => e.toString())
			}
			return false
		})
	}

	isSkipAvailable(): boolean {return false}

	isEnabled(): boolean {return true}
}

