import m from "mithril"
import { lang, TranslationText } from "../misc/LanguageViewModel.js"
import { BookingItemFeatureType, NewPaidPlans } from "../api/common/TutanotaConstants.js"
import { Dialog } from "../gui/base/Dialog.js"
import { PasswordForm, PasswordModel } from "./PasswordForm.js"
import { SelectMailAddressForm } from "./SelectMailAddressForm.js"
import { assertNotNull, getFirstOrThrow, ofClass } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { PreconditionFailedError } from "../api/common/error/RestError.js"
import { showBuyDialog } from "../subscription/BuyDialog.js"
import { TextField } from "../gui/base/TextField.js"
import { locator } from "../api/main/CommonLocator.js"
import { assertMainOrNode } from "../api/common/Env.js"
import { getAvailableDomains } from "./mailaddress/MailAddressesUtils.js"
import { toFeatureType } from "../subscription/SubscriptionUtils.js"
import { showUpgradeWizard } from "../subscription/UpgradeSubscriptionWizard.js"

assertMainOrNode()

export async function show(): Promise<void> {
	const availableDomains = await getAvailableDomains(locator.logins)
	const onNewPaidPlan = await locator.logins.getUserController().isNewPaidPlan()
	let emailAddress: string | null = null
	let errorMsg: TranslationText | null = "mailAddressNeutral_msg"
	let isVerificationBusy = false
	let userName = ""
	const passwordModel = new PasswordModel(locator.usageTestController, locator.logins, {
		checkOldPassword: false,
		enforceStrength: false,
		hideConfirmation: true,
	})
	let selectedDomain = getFirstOrThrow(availableDomains)
	let form = {
		view: () => {
			return [
				m(TextField, {
					label: "name_label",
					helpLabel: () => lang.get("loginNameInfoAdmin_msg"),
					value: userName,
					oninput: (value) => (userName = value),
				}),
				m(SelectMailAddressForm, {
					selectedDomain,
					availableDomains,
					onDomainChanged: (domain) => {
						if (domain.isPaid && !onNewPaidPlan) {
							showUpgradeWizard(locator.logins, NewPaidPlans, () => `${lang.get("paidEmailDomainLegacy_msg")}\n${lang.get("changePaidPlan_msg")}`)
						} else {
							selectedDomain = domain
						}
					},
					onValidationResult: (email, verificationResult) => {
						if (verificationResult.isValid) {
							emailAddress = email
							errorMsg = null
						} else {
							errorMsg = verificationResult.errorId
						}
					},
					onBusyStateChanged: (isBusy) => {
						isVerificationBusy = isBusy
					},
				}),
				m(PasswordForm, { model: passwordModel }),
			]
		},
	}

	let addUserOkAction = async (dialog: Dialog) => {
		if (isVerificationBusy) return
		const passwordFormError = passwordModel.getErrorMessageId()

		if (errorMsg) {
			Dialog.message(errorMsg)
			return
		} else if (passwordFormError) {
			Dialog.message(passwordFormError)
			return
		}

		const userController = locator.logins.getUserController()
		const planType = await userController.getPlanType()
		const newPlan = await userController.isNewPaidPlan()

		showProgressDialog(
			"pleaseWait_msg",
			showBuyDialog({
				featureType: newPlan ? toFeatureType(planType) : BookingItemFeatureType.LegacyUsers,
				bookingText: "bookingItemUsers_label",
				count: 1,
				freeAmount: 0,
				reactivate: false,
			}),
		).then(async (accepted) => {
			if (accepted) {
				const operation = locator.operationProgressTracker.startNewOperation()
				const p = locator.userManagementFacade.createUser(
					userName.trim(),
					assertNotNull(emailAddress),
					passwordModel.getNewPassword(),
					0,
					1,
					operation.id,
				)
				showProgressDialog(
					() =>
						lang.get("createActionStatus_msg", {
							"{index}": 0,
							"{count}": 1,
						}),
					p,
					operation.progress,
				)
					.catch(ofClass(PreconditionFailedError, (e) => Dialog.message("createUserFailed_msg")))
					.then(() => dialog.close())
					.finally(() => operation.done())
			}
		})
	}

	Dialog.showActionDialog({
		title: lang.get("addUsers_action"),
		child: form,
		okAction: addUserOkAction,
	})
}
