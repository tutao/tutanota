import m, { Children, Vnode, VnodeDOM } from "mithril"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { SignupForm } from "./SignupForm"
import { getDisplayNameOfPlanType } from "./FeatureListProvider"
import { PlanType } from "../api/common/TutanotaConstants.js"
import { lang, Translation } from "../misc/LanguageViewModel.js"
import { SignupFlowStage, SignupFlowUsageTestController } from "./usagetest/UpgradeSubscriptionWizardUsageTestUtils.js"
import { createAccount } from "./utils/PaymentUtils"

export class SignupPage implements WizardPageN<UpgradeSubscriptionData> {
	private dom!: HTMLElement

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>) {
		this.dom = vnode.dom as HTMLElement
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const data = vnode.attrs.data
		const newAccountData = data.newAccountData
		let mailAddress: undefined | string = undefined
		if (newAccountData) mailAddress = newAccountData.mailAddress
		return m(SignupForm, {
			onComplete: async (signupResult) => {
				if (signupResult.type === "success") {
					data.newAccountData = signupResult.newAccountData
					data.registrationCode = signupResult.registrationCode
					data.powChallengeSolutionPromise = signupResult.powChallengeSolutionPromise

					if (data.targetPlanType === PlanType.Free) {
						await createAccount(data, () => {
							emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG)
						})
					}
					emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
				} else {
					emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG)
				}
			},
			onChangePlan: () => {
				emitWizardEvent(this.dom, WizardEventType.SHOW_PREVIOUS_PAGE)
			},
			isBusinessUse: data.options.businessUse,
			isPaidSubscription: () => data.targetPlanType !== PlanType.Free,
			campaignToken: () => data.registrationDataId,
			prefilledMailAddress: mailAddress,
			newAccountData: data.newAccountData,
		})
	}
}

export class SignupPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {
	data: UpgradeSubscriptionData

	constructor(signupData: UpgradeSubscriptionData) {
		this.data = signupData
	}

	headerTitle(): Translation {
		return lang.makeTranslation("signup_title", getDisplayNameOfPlanType(this.data.targetPlanType))
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		// next action not available for this page
		SignupFlowUsageTestController.completeStage(SignupFlowStage.CREATE_ACCOUNT, this.data.targetPlanType, this.data.options.paymentInterval())
		return Promise.resolve(true)
	}

	prevAction(showErrorDialog: boolean): Promise<boolean> {
		SignupFlowUsageTestController.deletePing(SignupFlowStage.SELECT_PLAN)
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
