import { CustomDomainValidationResult, EnvProvider, UpgradePromptType } from "../../../../platform-kit/app-env"
import m, { Children, Vnode, VnodeDOM } from "mithril"
import type { AddDomainData } from "./AddDomainWizard"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { Dialog } from "../../../../ui/base/Dialog"
import type { WizardPageAttrs, WizardPageN } from "../../../../ui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../../../../ui/base/WizardDialog.js"
import { PreconditionFailedError } from "../../../../platform-kit/rest-client/error"
import { showPlanUpgradeRequiredDialog } from "../../../common/misc/SubscriptionDialogs.js"
import { isEmpty } from "../../../../platform-kit/utils"
import { locator } from "../../../common/api/main/CommonLocator"
import { createDnsRecordTable } from "./DnsRecordTable.js"
import { getAvailableMatchingPlans } from "../../../common/subscription/utils/SubscriptionUtils.js"
import { getCustomMailDomains } from "../../../common/api/common/utils/CustomerUtils.js"
import { assertEnumValue } from "../../../../platform-kit/meta"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons.js"
import { CustomDomainType, CustomDomainTypeCount } from "../../../../entities/sys/Utils"
import { ofClassAsync } from "../../../../platform-kit/utils/PromiseUtils"
import { TitleSection } from "../../../../ui/TitleSection.js"
import { theme } from "../../../../ui/theme"
import { px, size } from "../../../../ui/size"
import { Icons } from "../../../../ui/base/icons/Icons"

EnvProvider.assertMainOrNode()

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
		return m(".mt-24", [
			m(TitleSection, {
				icon: Icons.GlobeFilled,
				iconOptions: { color: theme.on_surface_variant },
				title: lang.get("verifyDomainOwnership_title"),
				subTitle: [
					m(
						"",
						lang.get("verifyDomainOwnershipExplanation_msg", {
							"{domain}": a.data.domain(),
						}),
					),
					m(".mt-8", lang.get("verifyOwnershipTXTrecord_msg")),
				],
				style: {
					marginTop: px(size.spacing_16),
					borderRadius: px(size.radius_16),
				},
			}),
			createDnsRecordTable([vnode.attrs.data.expectedVerificationRecord]),
			m(
				".flex-end.full-width.pt-32.mb-32",
				m(
					"",
					{ style: { width: "260px" } },
					m(PrimaryButton, {
						label: "continue_action",
						class: "wizard-next-button",
						onclick: () => emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE),
					}),
				),
			),
		])
	}
}

export class VerifyOwnershipPageAttrs implements WizardPageAttrs<AddDomainData> {
	data: AddDomainData

	constructor(domainData: AddDomainData) {
		this.data = domainData
	}

	headerTitle(): TranslationKey {
		return "domainSetup_title"
	}

	stepTitle = "domainSetupStepVerify_title" as TranslationKey

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

					return "customDomainErrorDomainNotAvailable_msg"
				} else {
					const errorMessageMap: Record<CustomDomainValidationResult, TranslationKey> = {
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_OK]: "emptyString_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DNS_LOOKUP_FAILED]: "customDomainErrorDnsLookupFailure_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_FOUND]: "customDomainErrorDomainNotFound_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_NAMESERVER_NOT_FOUND]: "customDomainErrorNameserverNotFound_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE]: "customDomainErrorDomainNotAvailable_msg",
						[CustomDomainValidationResult.CUSTOM_DOMAIN_VALIDATION_RESULT_VALIDATION_FAILED]: "customDomainErrorValidationFailed_msg",
					}
					return lang.makeTranslation(
						"error_msg",
						lang.get(errorMessageMap[validationResult]) + //TODO correct to use? customDomainErrorOtherTxtRecords_msg
							(result.invalidDnsRecords.length > 0
								? " " + lang.get("customDomainErrorOtherTxtRecords_msg") + "\n" + result.invalidDnsRecords.map((r) => r.value).join("\n")
								: ""),
					)
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
				ofClassAsync(PreconditionFailedError, async (e) => {
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
							showPlanUpgradeRequiredDialog(UpgradePromptType.MORE_CUSTOM_DOMAINS_NEEDED, plans, "moreCustomDomainsRequired_msg")
						}
					} else {
						Dialog.message(lang.makeTranslation("error_msg", e.toString()))
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
