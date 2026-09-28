import { EnvProvider, UpgradePromptType } from "@tutao/app-env"
import { Translation, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { locator } from "../api/main/CommonLocator"
import { FeatureListProvider, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { PaymentData, UpgradePromptTypeByName, UpgradeType } from "./utils/SubscriptionUtils"
import { PriceAndConfigProvider, OfferPrice } from "./utils/PriceUtils"
import { LoginController } from "../api/main/LoginController.js"
import { Styles } from "../../../ui/styles.js"
import { PowSolution } from "../api/common/pow-worker"
import type { UsageTest } from "@tutao/usagetests"
import { AccountingInfo, Customer } from "@tutao/entities/sys"
import { AvailablePlanType, isExternalPaymentMethod, NewPaidPlans, PlanType } from "../../../entities/sys/Utils"
import { InvoiceData } from "./utils/PaymentUtils"
import { UpgradeViewModel } from "./UpgradeViewModel"
import { showUpgradeDialog } from "./UpgradeView"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { completeUpgradeStage } from "../ratings/UserSatisfactionUtils"

EnvProvider.assertMainOrNode()
export type SubscriptionParameters = {
	subscription: string | null
	type: string | null
	interval: string | null // typed as string because m.parseQueryString returns an object with strings
}

export type NewAccountData = {
	mailAddress: string
	recoverCode: Hex
	password: string
}
export type ReferralData = { code: string; isCalledBySatisfactionDialog: boolean }

export type UpgradeSubscriptionData = {
	options: SelectedSubscriptionOptions
	invoiceData: InvoiceData
	paymentData: PaymentData
	targetPlanType: PlanType
	price: OfferPrice | null
	nextYearPrice: OfferPrice | null
	accountingInfo: AccountingInfo | null
	// not initially set for signup but loaded in InvoiceAndPaymentDataPage
	customer: Customer | null
	// not initially set for signup but loaded in InvoiceAndPaymentDataPage
	newAccountData: NewAccountData | null
	registrationDataId: string | null
	priceInfoTextId: TranslationKey | null
	upgradeType: UpgradeType
	planPrices: PriceAndConfigProvider
	currentPlan: PlanType | null
	subscriptionParameters: SubscriptionParameters | null
	featureListProvider: FeatureListProvider
	referralData: null | ReferralData
	multipleUsersAllowed: boolean
	acceptedPlans: readonly AvailablePlanType[]
	msg: Translation | null
	firstMonthForFreeOfferActive: boolean
	isCalledBySatisfactionDialog: boolean
	registrationCode?: string
	powChallengeSolutionPromise?: Promise<PowSolution>
	emailInputStore?: string
	passwordInputStore?: string
	upgradeUsageTest: UsageTest | null
	upgradePromptType: UpgradePromptType | null
}

export async function showUpgradeWizard({
	upgradePromptType,
	logins,
	isCalledBySatisfactionDialog = false,
	acceptedPlans = NewPaidPlans,
	msg,
}: {
	upgradePromptType: UpgradePromptType | null
	logins: LoginController
	isCalledBySatisfactionDialog?: boolean
	acceptedPlans?: readonly AvailablePlanType[]
	msg?: Translation
}): Promise<void> {
	let upgradeUsageTest: UsageTest | null = null
	if (logins.getUserController().isFreeAccount() && upgradePromptType != null) {
		upgradeUsageTest = locator.usageTestController.getTest("upgrade.paywall.upgradePaywallTypeAndResult")

		const stage = upgradeUsageTest.getStage(0)
		stage.setMetric({
			name: "upgradePromptType",
			value: UpgradePromptTypeByName[upgradePromptType],
		})
		await stage.complete()
	}

	const viewModel = await showProgressDialog("pleaseWait_msg", UpgradeViewModel.create(logins, acceptedPlans, msg))
	return showUpgradeDialog(viewModel, () => {
		if (!isExternalPaymentMethod(viewModel.paymentData.paymentMethod) && upgradePromptType != null) {
			const stage = upgradeUsageTest?.getStage(1)
			stage?.setMetric({ name: "upgradeResult", value: `${UpgradePromptTypeByName[upgradePromptType]}.Upgraded` })
			void stage?.complete()
		}
		if (isCalledBySatisfactionDialog) {
			completeUpgradeStage(viewModel.currentPlan, viewModel.targetPlanType)
		}
	})
}

export function getPlanSelectorTest() {
	const test = locator.usageTestController.getTest(`signup.paywall.${Styles.get().isMobileLayout() ? "mobile" : "desktop"}`)
	test.recordTime = true
	return test
}
