import m, { Children, Vnode } from "mithril"
import { EnvProvider, PaymentSetup } from "@tutao/app-env"
import { BaseTopLevelView } from "../../../ui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../../ui/base/TopLevelView.js"
import { createWizard, WizardAttrs } from "../../../ui/base/wizard/Wizard"
import { PlanSelectorPage } from "./PlanSelectorPage"
import { SignupFormPage } from "./SignupFormPage"
import InvoiceAndPaymentDataPageNew from "./InvoiceAndPaymentDataPageNew"
import { IconMessageBox, InfoMessaggeBoxAttrs } from "../../../ui/base/ColumnEmptyMessageBox"
import { theme } from "../../../ui/theme"
import { RecoveryKitPage } from "../subscription/RecoveryKitPage"
import { UpgradeConfirmSubscriptionPageNew } from "../subscription/UpgradeConfirmSubscriptionPageNew"
import { ReferralType, SignupFlowStage, SignupFlowUsageTestController } from "../subscription/usagetest/UpgradeSubscriptionWizardUsageTestUtils"
import { completeUpgradeStage } from "../ratings/UserSatisfactionUtils"
import { windowFacade } from "../misc/WindowFacade"
import SignupWizardLayout from "./SignupWizardLayout"
import { noOp } from "@tutao/utils"
import { Icons } from "../../../ui/base/icons/Icons"
import { PlanType } from "../../../entities/sys/Utils"
import { UsageTestModel } from "../misc/UsageTestModel"
import { UsageTestController } from "@tutao/usagetests"
import { SignupViewModel } from "./models/SignupViewModel"

EnvProvider.assertMainOrNode()

export interface SignupViewAttrs extends TopLevelAttrs {
	viewModel: SignupViewModel
	usageTestModel: UsageTestModel
	usageTestController: UsageTestController
}

export class SignupView extends BaseTopLevelView implements TopLevelView<SignupViewAttrs> {
	private bottomMargin = 0

	private readonly wizardViewModel: SignupViewModel
	private unregisterListener: (...args: Array<any>) => any = noOp
	private SignupWizard = createWizard<SignupViewModel>()

	constructor({ attrs }: Vnode<SignupViewAttrs>) {
		super()
		this.wizardViewModel = attrs.viewModel
	}

	async oncreate({ attrs }: Vnode<SignupViewAttrs>) {
		const activeTests = await attrs.usageTestModel.loadActiveUsageTests()
		attrs.usageTestController.setTests(activeTests)
		await this.wizardViewModel.init()
		let referralConversion: ReferralType = "not_referred"
		if (this.wizardViewModel.referralData && this.wizardViewModel.referralData.isCalledBySatisfactionDialog)
			referralConversion = "satisfactiondialog_referral"
		else if (this.wizardViewModel.referralData && !this.wizardViewModel.referralData.isCalledBySatisfactionDialog) referralConversion = "organic_referral"
		SignupFlowUsageTestController.initSignupFlowUsageTest(referralConversion)

		if (!EnvProvider.get().isDesktop()) {
			this.unregisterListener = windowFacade.addWindowCloseListener(async () => {})
		}

		m.redraw()
	}

	onremove() {
		this.unregisterListener()
	}

	keyboardListener = (keyboardSize: number) => {
		this.bottomMargin = keyboardSize
		m.redraw()
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {}

	view({ attrs }: Vnode<SignupViewAttrs>) {
		return m(
			"#signup-view.main-view.flex.col.nav-bg",
			{
				oncreate: () => windowFacade.addKeyboardSizeListener(this.keyboardListener),
				onremove: () => windowFacade.removeKeyboardSizeListener(this.keyboardListener),
				style: {
					marginBottom: this.bottomMargin + "px",
				},
			},
			[
				!this.wizardViewModel.isInitialized
					? m(
							".flex-grow.flex.col.justify-center",
							m(IconMessageBox, {
								icon: Icons.Sync,
								message: "pleaseWait_msg",
								color: theme.on_surface_variant,
							} satisfies InfoMessaggeBoxAttrs),
						)
					: this.renderSignupPages(attrs),
			],
		)
	}

	renderSignupPages(attrs: SignupViewAttrs): Children {
		return attrs.viewModel.isFreeOnly ? this.renderFreeOnlySignupPages(attrs) : this.renderDefaultSignupPages(attrs)
	}

	renderFreeOnlySignupPages(attrs: SignupViewAttrs): Children {
		return m(this.SignupWizard, {
			layout: SignupWizardLayout,
			steps: [
				{
					title: "Create Account",
					content: SignupFormPage,
					isBackButtonEnabled: () => true,
					onNext: () => {
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.CREATE_ACCOUNT,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
						)
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.SELECT_PAYMENT_METHOD,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
							this.wizardViewModel.paymentData.paymentMethod,
						)
					},
					onPrev: (ctx) => {
						m.route.set("/")
					},
				},
				{
					title: "Recovery Kit",
					content: RecoveryKitPage,
					onNext: () => this.unregisterListener(),
					onPrev: () => {},
					isBackButtonEnabled: () => false,
				},
			],
			viewModel: this.wizardViewModel,
		} satisfies WizardAttrs<SignupViewModel>)
	}

	renderDefaultSignupPages(attrs: SignupViewAttrs): Children {
		return m(this.SignupWizard, {
			layout: SignupWizardLayout,
			steps: [
				{
					title: "Select Plan",
					content: PlanSelectorPage,
					onNext: () =>
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.SELECT_PLAN,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
						),
					onPrev: (ctx) => {
						if (ctx.viewModel.options.businessUse() && ctx.viewModel.personalPlansAvailable) {
							ctx.viewModel.options.businessUse(false)
						} else {
							m.route.set("/")
						}
					},
					isBackButtonEnabled: () => true,
					showProgress: () => false,
				},
				{
					title: "Create Account",
					content: SignupFormPage,
					onNext: () => {
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.CREATE_ACCOUNT,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
						)
						if (EnvProvider.get().getPaymentSetup() !== PaymentSetup.Default) {
							SignupFlowUsageTestController.completeStage(
								SignupFlowStage.SELECT_PAYMENT_METHOD,
								this.wizardViewModel.targetPlanType,
								this.wizardViewModel.options.paymentInterval(),
								this.wizardViewModel.paymentData.paymentMethod,
							)
						}
					},
				},
				{
					title: "Payment",
					content: InvoiceAndPaymentDataPageNew,
					onNext: () => {
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.SELECT_PAYMENT_METHOD,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
							this.wizardViewModel.paymentData.paymentMethod,
						)
					},
					isEnabled: (ctx) => ctx.viewModel.targetPlanType !== PlanType.Free && EnvProvider.get().getPaymentSetup() === PaymentSetup.Default,
				},
				{
					title: "Order Confirmation",
					content: UpgradeConfirmSubscriptionPageNew,
					onNext: () => {
						let referralConversion: ReferralType = "not_referred"
						if (this.wizardViewModel.referralData && this.wizardViewModel.referralData.isCalledBySatisfactionDialog)
							referralConversion = "satisfactiondialog_referral"
						else if (this.wizardViewModel.referralData && !this.wizardViewModel.referralData.isCalledBySatisfactionDialog)
							referralConversion = "organic_referral"
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.CONFIRM_PAYMENT,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
							this.wizardViewModel.paymentData.paymentMethod,
							referralConversion,
						)

						if (this.wizardViewModel.isCalledBySatisfactionDialog) {
							completeUpgradeStage(this.wizardViewModel.currentPlan!, this.wizardViewModel.targetPlanType)
						}
					},
					isEnabled: (ctx) => ctx.viewModel.targetPlanType !== PlanType.Free,
				},
				{
					title: "Recovery Kit",
					content: RecoveryKitPage,
					onNext: () => this.unregisterListener(),
					isBackButtonEnabled: () => false,
				},
			],
			viewModel: this.wizardViewModel,
		} satisfies WizardAttrs<SignupViewModel>)
	}
}
