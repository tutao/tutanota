import m, { Children, Vnode, VnodeDOM } from "mithril"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import { SignupForm } from "./SignupForm"
import { getDisplayNameOfPlanType } from "./FeatureListProvider"
import { PlanType } from "../api/common/TutanotaConstants.js"
import { lang, Translation } from "../misc/LanguageViewModel.js"

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
			onComplete: (signupResult) => {
				if (signupResult.type === "success") {
					if (signupResult.newAccountData) data.newAccountData = signupResult.newAccountData
					emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
				} else {
					emitWizardEvent(this.dom, WizardEventType.CLOSE_DIALOG)
				}
			},
			onChangePlan: () => {
				emitWizardEvent(this.dom, WizardEventType.SHOW_PREVIOUS_PAGE)
			},
			isBusinessUse: data.options.businessUse,
			isPaidSubscription: () => data.type !== PlanType.Free,
			campaign: () => data.registrationDataId,
			prefilledMailAddress: mailAddress,
			readonly: !!newAccountData,
		})
	}
}

export class SignupPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {
	data: UpgradeSubscriptionData

	constructor(signupData: UpgradeSubscriptionData) {
		this.data = signupData
	}

	headerTitle(): Translation {
		const title = getDisplayNameOfPlanType(this.data.type)

		if (this.data.type === PlanType.Essential || this.data.type === PlanType.Advanced) {
			return lang.makeTranslation("signup_business", title + " Business")
		} else {
			return lang.makeTranslation("signup_title", title)
		}
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
