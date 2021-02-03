// @flow
import m from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {SubscriptionType} from "./SubscriptionUtils"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"
import {SignupForm} from "./SignupForm"


type ConfirmStatus = {
	type: string,
	text: TranslationKey
}

export class SignupPage implements WizardPageN<UpgradeSubscriptionData> {

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const data = vnode.attrs.data
		const newAccountData = data.newAccountData
		let mailAddress
		if (newAccountData) mailAddress = newAccountData.mailAddress

		return m(SignupForm, {
			newSignupHandler: newAccountData => {
				if (newAccountData) data.newAccountData = newAccountData
				emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
			},
			isBusinessUse: data.options.businessUse,
			isPaidSubscription: () => data.type !== SubscriptionType.Free,
			campaign: () => data.campaign,
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

	headerTitle(): string {
		return lang.get("subscription_label")
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
