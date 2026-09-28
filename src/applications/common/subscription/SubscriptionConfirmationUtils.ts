import m from "mithril"
import { Const } from "@tutao/app-env"
import { createSwitchAccountTypePostIn, SwitchAccountTypeService_POST } from "@tutao/entities/sys"
import { elementIdToId } from "@tutao/meta"
import { MobilePaymentResultType } from "@tutao/native-bridge/generatedIpc/enums"
import { BadGatewayError, PreconditionFailedError } from "@tutao/rest-client/error"
import { assertNotNull, base64ExtToBase64, base64ToUint8Array } from "@tutao/utils"
import { AccountType, isExternalPaymentMethod, PaymentMethodType, PlanType } from "../../../entities/sys/Utils"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector"
import { Dialog } from "../../../ui/base/Dialog"
import { ExternalLink } from "../../../ui/base/ExternalLink"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { MobilePaymentError } from "../api/common/error/MobilePaymentError"
import { locator } from "../api/main/CommonLocator"
import type { PaymentDetailsModel } from "./PaymentDetailsModel"
import {
	externalStorePlanName,
	getPreconditionFailedPaymentMsg,
	SubscriptionApp,
	UpgradeType,
	waitUntilCustomerInfoPlanTypeIsCorrect,
} from "./utils/SubscriptionUtils"

type SubscriptionCheckoutData = Pick<PaymentDetailsModel, "options" | "paymentData" | "customer" | "upgradeType"> & { targetPlanType: PlanType }

export async function upgrade(data: SubscriptionCheckoutData, referralCode: string | null = null): Promise<boolean> {
	if (isExternalPaymentMethod(data.paymentData.paymentMethod)) {
		return upgradeWithExternalStore(data)
	} else {
		return upgradeWithTuta(data, referralCode)
	}
}

async function upgradeWithTuta(data: SubscriptionCheckoutData, referralCode: string | null): Promise<boolean> {
	const serviceData = createSwitchAccountTypePostIn({
		accountType: AccountType.PAID,
		customer: null,
		plan: data.targetPlanType,
		date: Const.CURRENT_DATE,
		referralCode,
		specialPriceUserSingle: null,
		surveyData: null,
		app: ClientDetector.get().isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail,
	})

	try {
		await showProgressDialog("pleaseWait_msg", locator.serviceExecutor.execute(SwitchAccountTypeService_POST, serviceData, null))
		return true
	} catch (e) {
		const signupMessage = data.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""
		if (e instanceof PreconditionFailedError) {
			await Dialog.message(lang.makeTranslation("precondition_failed", lang.get(getPreconditionFailedPaymentMsg(e.data)) + signupMessage))
		} else if (e instanceof BadGatewayError) {
			await Dialog.message(lang.makeTranslation("payment_failed", lang.get("paymentProviderNotAvailableError_msg") + signupMessage))
		} else {
			throw e
		}
		return false
	}
}

async function upgradeWithExternalStore(data: SubscriptionCheckoutData): Promise<boolean> {
	const paymentMethod = data.paymentData.paymentMethod
	const success = await handleExternalStorePayment(data)
	if (!success) return false

	const receivedNotification = await showProgressDialog(
		paymentMethod === PaymentMethodType.AppStore ? "waitingForAppStoreConfirmation_msg" : "waitingForGooglePlayConfirmation_msg",
		waitUntilCustomerInfoPlanTypeIsCorrect(data.targetPlanType, elementIdToId(assertNotNull(data.customer?._id))),
	)
	if (!receivedNotification) {
		await Dialog.message(paymentMethod === PaymentMethodType.AppStore ? "appStoreConfirmationTimeout_msg" : "googlePlayConfirmationTimeout_msg", () =>
			m(".pt-8", [
				m(ExternalLink, {
					href:
						paymentMethod === PaymentMethodType.AppStore
							? "https://apps.apple.com/account/subscriptions"
							: "https://play.google.com/store/account/subscriptions",
					text: lang.get("settings_label"),
					isCompanySite: false,
				}),
			]),
		)
	}
	return true
}

async function handleExternalStorePayment(data: SubscriptionCheckoutData): Promise<boolean> {
	const customerId = assertNotNull(locator.logins.getUserController().user.customer)
	const customerIdBytes = base64ToUint8Array(base64ExtToBase64(customerId))
	try {
		const result = await showProgressDialog(
			"pleaseWait_msg",
			locator.mobilePaymentsFacade.requestSubscriptionToPlan(
				externalStorePlanName(data.targetPlanType),
				data.options.paymentInterval(),
				customerIdBytes,
				null,
			),
		)
		if (result.result !== MobilePaymentResultType.Success) return false
	} catch (e) {
		if (!(e instanceof MobilePaymentError)) throw e
		console.error("external store subscription failed", e)
		await Dialog.message("appStoreSubscriptionError_msg", e.message)
		return false
	}
	return true
}
