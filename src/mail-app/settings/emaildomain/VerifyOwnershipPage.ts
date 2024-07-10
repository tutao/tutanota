import { assertEnumValue, CustomDomainType, CustomDomainTypeCount, CustomDomainValidationResult } from "../../../common/api/common/TutanotaConstants"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import type { AddDomainData } from "./AddDomainWizard"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { Dialog } from "../../../common/gui/base/Dialog"
import type { WizardPageAttrs, WizardPageN } from "../../../common/gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../../common/gui/base/WizardDialog.js"
import { PreconditionFailedError } from "../../../common/api/common/error/RestError.js"
import { showPlanUpgradeRequiredDialog } from "../../../common/misc/SubscriptionDialogs.js"
import { isEmpty, ofClass } from "@tutao/tutanota-utils"
import { locator } from "../../../common/api/main/CommonLocator"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { createDnsRecordTable } from "./DnsRecordTable.js"
import { getAvailableMatchingPlans } from "../../../common/subscription/SubscriptionUtils.js"
import { getCustomMailDomains } from "../../../common/api/common/utils/CustomerUtils.js"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton.js"

assertMainOrNode()

export enum CustomDomainFailureReasons {
	LIMIT_REACHED = "customdomainservice.limit_reached",
	DOMAIN_IN_USE = "customdomainservice.domain_in_use",
}

export class VerifyOwnershipPage implements WizardPageN<AddDomainData> {
	private dom!: HTMLElement

	oncreate(vnode: VnodeDOM<WizardPageAttrs<AddDomainData>>) {
		this.dom = vnode.dom as HTMLElement
		// We expect that the page is created again each time when domain is changed so we only need to load it in oncreate.
		const { data } = vnode.attrs
		locator.customerFacade.getDomainValidationRecord(data.domain()).then((recordValue) => {
			data.expectedVerificationRecord.value = recordValue
			m.redraw()
		})
	}

	view(vnode: Vnode<WizardPageAttrs<AddDomainData>>): Children {
		const a = vnode.attrs
		return [
			m("h4.mt-l.text-center", lang.get("verifyDomainOwnership_title")),
			m(
				"p",
				lang.get("verifyDomainOwnershipExplanation_msg", {
					"{domain}": a.data.domain(),
				}),
			),
			m("p", lang.get("verifyOwnershipTXTrecord_msg")),
			createDnsRecordTable([vnode.attrs.data.expectedVerificationRecord]),
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
						label: "next_action",
						onclick: () => emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE),
					}),
				),
			),
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
		return showProgressDialog(
			"pleaseWait_msg",
			locator.customerFacade.addDomain(this.data.domain()).then((result) => {
				const validationResult = assertEnumValue(CustomDomainValidationResult, result.validationResult)
				if (validationResult === CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_OK) {
					return null
				} else if (validationResult === CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE) {
					let customDomainInfos = getCustomMailDomains(this.data.customerInfo)

					//domain is already assigned to this account
					if (customDomainInfos.some((domainInfo) => domainInfo.domain === this.data.domain())) {
						return null
					}

					return () => lang.get("customDomainErrorDomainNotAvailable_msg")
				} else {
					const errorMessageMap: Record<CustomDomainValidationResult, TranslationKey> = {
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_OK]: "emptyString_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DNS_LOOKUP_FAILED]: "customDomainErrorDnsLookupFailure_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_FOUND]: "customDomainErrorDomainNotFound_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_NAMESERVER_NOT_FOUND]: "customDomainErrorNameserverNotFound_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE]: "customDomainErrorDomainNotAvailable_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_VALIDATION_FAILED]: "customDomainErrorValidationFailed_msg",
					}
					return () =>
						lang.get(errorMessageMap[validationResult]) + //TODO correct to use? customDomainErrorOtherTxtRecords_msg
						(result.invalidDnsRecords.length > 0
							? " " + lang.get("customDomainErrorOtherTxtRecords_msg") + "\n" + result.invalidDnsRecords.map((r) => r.value).join("\n")
							: "")
				}
			}),
		)
			.then((message) => {
				if (message) {
					return showErrorDialog ? Dialog.message(message).then(() => false) : false
				}

				return true
			})
			.catch(
				ofClass(PreconditionFailedError, async (e) => {
					if (e.data === CustomDomainFailureReasons.LIMIT_REACHED) {
						const nbrOfCustomDomains = this.data.customerInfo.domainInfos.filter((domainInfo) => domainInfo.whitelabelConfig == null).length
						const plans = await getAvailableMatchingPlans(locator.serviceExecutor, (config) => {
							if (config.customDomainType in CustomDomainTypeCount) {
								const planDomains = CustomDomainTypeCount[config.customDomainType as CustomDomainType]
								return planDomains === -1 || planDomains > nbrOfCustomDomains
							}
							return false
						})

						if (isEmpty(plans)) {
							// shouldn't happen while we have the Unlimited plan...
							Dialog.message("tooManyCustomDomains_msg")
						} else {
							// ignore promise. always return false to not switch to next page.
							showPlanUpgradeRequiredDialog(plans, "moreCustomDomainsRequired_msg")
						}
					} else {
						Dialog.message(() => e.toString())
					}
					return false
				}),
			)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
