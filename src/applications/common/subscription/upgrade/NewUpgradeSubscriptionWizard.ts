import { AvailablePlanType, NewPaidPlans, PlanType } from "../../../../entities/sys/Utils"
import { EnvProvider, PaymentSetup, UpgradePromptType } from "@tutao/app-env"
import { LoginController } from "../../api/main/LoginController"
import { lang, Translation } from "../../../../ui/utils/LanguageViewModel"
import { Dialog } from "../../../../ui/base/Dialog"
import { SignupFlowUsageTestController } from "../usagetest/UpgradeSubscriptionWizardUsageTestUtils"
import type { UsageTest } from "@tutao/usagetests"
import { locator } from "../../api/main/CommonLocator"
import { getDefaultPaymentMethod, getPaymentMethodType, UpgradePromptTypeByName, UpgradeType } from "../utils/SubscriptionUtils"
import { asPaymentInterval, PriceAndConfigProvider } from "../utils/PriceUtils"
import { FeatureListProvider } from "../FeatureListProvider"
import stream from "mithril/stream"
import { isPersonalPlanAvailable } from "../utils/PlanSelectorUtils"
import { formatNameAndAddress } from "../../api/common/utils/CommonFormatter"
import { getByAbbreviation } from "../../gui/CountryList"
import { defer, filterInt } from "@tutao/utils"
import { windowFacade } from "../../misc/WindowFacade"
import { UpgradeSubscriptionData } from "../UpgradeSubscriptionWizard"
import { MultiPageDialog } from "../../../../ui/dialogs/MultiPageDialog"
import { ButtonType } from "../../../../ui/base/Button"
import { PlanSelectorPage, PlanSelectorPageAttrs } from "../../signup/PlanSelectorPage"
import m from "mithril"

export type UpgradeSubscriptionPage = "planSelection" | "paymentMethod" | "checkout"

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
	const upgradeUsageTest = await resolveUsageTest(logins, upgradePromptType)

	const [customer, accountingInfo] = await Promise.all([logins.getUserController().reloadCustomer(), logins.getUserController().loadAccountingInfo()])

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)

	const prices = priceDataProvider.getRawPricingData()
	const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
	const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)
	const bonusMonths = filterInt(prices.bonusMonthsForYearlyPlan)
	const upgradeData: UpgradeSubscriptionData = {
		options: {
			businessUse: stream(!isPersonalPlanAvailable(acceptedPlans) ? true : prices.business),
			paymentInterval: stream(asPaymentInterval(accountingInfo.paymentInterval)),
		},
		invoiceData: {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo, // only for EU countries otherwise empty
		},
		paymentData: {
			paymentMethod: getPaymentMethodType(accountingInfo) || (await getDefaultPaymentMethod()),
			creditCardData: null,
		},
		price: null,
		targetPlanType: SignupFlowUsageTestController.getUsageTestVariant() === 1 ? PlanType.Revolutionary : PlanType.Legend,
		nextYearPrice: null,
		accountingInfo: accountingInfo,
		customer: customer,
		newAccountData: null,
		registrationDataId: null,
		priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
		upgradeType: UpgradeType.Initial,
		currentPlan: await logins.getUserController().getPlanType(),
		subscriptionParameters: null,
		planPrices: priceDataProvider,
		featureListProvider: featureListProvider,
		referralData: null,
		multipleUsersAllowed: false,
		acceptedPlans,
		msg: msg ?? null,
		firstMonthForFreeOfferActive: prices.firstMonthForFreeForYearlyPlan,
		isCalledBySatisfactionDialog,
		upgradeUsageTest,
		upgradePromptType,
		bonusMonthsForYearlyPlans: Number.isNaN(bonusMonths) ? 0 : bonusMonths,
	}

	const showPaymentMethodSelector = EnvProvider.get().getPaymentSetup() === PaymentSetup.Default

	const router = (
		dialog: Dialog,
		navigateToPage: (targetPage: UpgradeSubscriptionPage, skipAnimating?: boolean) => void,
		goBack: (to?: UpgradeSubscriptionPage) => void,
	) => ({
		planSelection: {
			content: m(PlanSelectorPage, {
				viewModel: upgradeData,
				ctx: {
					setLabel: () => alert("didn't set this"),
					goNext: () => navigateToPage(showPaymentMethodSelector ? "paymentMethod" : "checkout"),
				},
			} satisfies PlanSelectorPageAttrs),
			title: "planSelection",
			rightAction: {
				label: lang.getTranslation("close_alt"),
				click: () => dialog.close(),
				type: ButtonType.Secondary,
			},
			// leftAction?: ButtonAttrs | undefined;
			onClose: () => console.log("planSelectiondone!"),
		},
		paymentMethod: {
			content: null,
			title: "paymentMethod",
			// rightAction?: ButtonAttrs | undefined;
			// leftAction?: ButtonAttrs | undefined;
			onClose: () => console.log("paymentMethoddone!"),
		},
		checkout: {
			content: null,
			title: "checkout",
			// rightAction?: ButtonAttrs | undefined;
			// leftAction?: ButtonAttrs | undefined;
			onClose: () => console.log("checkoutdone!"),
		},
	})

	const dialog = new MultiPageDialog<UpgradeSubscriptionPage>("planSelection", router, windowFacade).getDialog()

	const deferred = defer<void>()
	dialog.setCloseHandler(() => deferred.resolve())
	dialog.show()

	// const wizardBuilder = createWizardDialog({
	// 	data: upgradeData,
	// 	pages: wizardPages,
	// 	closeAction: async () => {
	// 		deferred.resolve()
	// 	},
	// 	dialogType: DialogType.EditLarge,
	// 	windowFacade,
	// })
	// wizardBuilder.attrs.updateHeaderBarAttrs()
	// wizardBuilder.dialog.show()
	return deferred.promise
}

async function resolveUsageTest(logins: LoginController, upgradePromptType: UpgradePromptType | null): Promise<UsageTest | null> {
	// Invalidates the "signup.flow" usage test, because upgrades and signups should not be mixed in this usage test.
	SignupFlowUsageTestController.invalidateUsageTest()
	if (!logins.getUserController().isFreeAccount() || upgradePromptType == null) return null
	const upgradeUsageTest = locator.usageTestController.getTest("upgrade.paywall.upgradePaywallTypeAndResult")

	const stage = upgradeUsageTest.getStage(0)
	stage.setMetric({
		name: "upgradePromptType",
		value: UpgradePromptTypeByName[upgradePromptType],
	})
	await stage.complete()
	return upgradeUsageTest
}
