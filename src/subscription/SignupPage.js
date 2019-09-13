// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {deleteCampaign} from "./UpgradeSubscriptionWizard"
import {SelectMailAddressForm} from "../settings/SelectMailAddressForm"
import {Checkbox} from "../gui/base/Checkbox"
import {isApp, isTutanotaDomain} from "../api/Env"
import {getWhitelabelRegistrationDomains} from "../login/LoginView"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {TextField} from "../gui/base/TextField"
import {PasswordForm} from "../settings/PasswordForm"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {AccountType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {SysService} from "../api/entities/sys/Services"
import {worker} from "../api/main/WorkerClient"
import {AccessDeactivatedError, AccessExpiredError, InvalidDataError} from "../api/common/error/RestError"
import {neverNull} from "../api/common/utils/Utils"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {HttpMethod} from "../api/common/EntityFunctions"
import {serviceRequest, serviceRequestVoid} from "../api/main/Entity"
import {RegistrationCaptchaServiceReturnTypeRef} from "../api/entities/sys/RegistrationCaptchaServiceReturn"
import {showWorkerProgressDialog} from "../gui/base/ProgressDialog"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {TextFieldN} from "../gui/base/TextFieldN"
import {createRegistrationCaptchaServiceGetData} from "../api/entities/sys/RegistrationCaptchaServiceGetData"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {createRegistrationCaptchaServiceData} from "../api/entities/sys/RegistrationCaptchaServiceData"
import {deviceConfig} from "../misc/DeviceConfig"
import {SubscriptionType} from "./SubscriptionUtils"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"
import {SignupForm} from "../api/main/SignupForm"


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
