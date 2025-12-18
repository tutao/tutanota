import m, { Children, ClassComponent, Vnode } from "mithril"
import { Dialog } from "../gui/base/Dialog"
import { lang, MaybeTranslation } from "../misc/LanguageViewModel"
import { formatPrice, formatPriceWithInfo, getPaymentMethodName, PaymentInterval } from "./utils/PriceUtils"
import { createSwitchAccountTypePostIn } from "../api/entities/sys/TypeRefs.js"
import { AccountType, Const, PaymentMethodType, PlanType } from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { BadGatewayError, PreconditionFailedError } from "../api/common/error/RestError"
import { appStorePlanName, getPreconditionFailedPaymentMsg, SubscriptionApp, UpgradeType } from "./utils/SubscriptionUtils"
import { base64ExtToBase64, base64ToUint8Array, neverNull, ofClass } from "@tutao/tutanota-utils"
import { locator } from "../api/main/CommonLocator"
import { SwitchAccountTypeService } from "../api/entities/sys/Services"
import { getDisplayNameOfPlanType, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { MobilePaymentResultType } from "../native/common/generatedipc/MobilePaymentResultType"
import { updatePaymentData } from "./InvoiceAndPaymentDataPage"
import { SessionType } from "../api/common/SessionType"
import { MobilePaymentError } from "../api/common/error/MobilePaymentError.js"
import { client } from "../misc/ClientDetector.js"
import { DateTime } from "luxon"
import { formatDate } from "../misc/Formatter.js"
import { WizardStepContext } from "../gui/base/wizard/WizardController"
import { SignupViewModel } from "../signup/SignupView"
import { px } from "../gui/size"
import { theme } from "../gui/theme"
import { LoginTextField } from "../gui/base/LoginTextField"
import { Icons } from "../gui/base/icons/Icons"
import { IconButton } from "../gui/base/IconButton"
import { styles } from "../gui/styles"
import { getTutaLogo } from "../gui/base/Logo"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"

export class UpgradeConfirmSubscriptionPageNew implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view({ attrs: { ctx } }: Vnode<WizardStepComponentAttrs<SignupViewModel>>): Children {
		const data = ctx.viewModel
		const isYearly = data.options.paymentInterval() === PaymentInterval.Yearly
		const subscription = isYearly ? lang.get("pricing.yearly_label") : lang.get("pricing.monthly_label")

		const isFirstMonthForFree = data.planPrices!.getRawPricingData().firstMonthForFreeForYearlyPlan && isYearly
		const isAppStorePayment = data.paymentData.paymentMethod === PaymentMethodType.AppStore

		return m(".flex.flex-column.full-width", [
			styles.isMobileLayout() && m(".center.logo-height.mb-32", m.trust(getTutaLogo())),
			m(`h1.font-mdio.line-height-1${styles.isMobileLayout() ? ".text-center" : ".left"}`, lang.get("confirm_order_page_title")),
			m(
				`p${styles.isMobileLayout() ? ".text-center" : ".left"}`,
				{ style: { color: theme.on_surface_variant } },
				lang.get("confirm_order_page_subtitle"),
			),

			m(".flex.gap-16", [
				m(".flex-grow", [
					m(
						".flex.col.gap-16.pt-16.pb-16.plr-16.border-radius-16",
						{
							style: {
								"background-color": theme.surface_container_high,
								color: theme.on_surface_variant,
							},
						},
						[
							m(LoginTextField, {
								label: "subscription_label",
								value: getDisplayNameOfPlanType(data.targetPlanType),
								isReadOnly: true,
								class: "",
								leadingIcon: {
									icon: data.targetPlanType === PlanType.Revolutionary ? Icons.Revo : Icons.Legend,
									color: theme.on_surface_variant,
								},
								injectionsRight: () => {
									return m(IconButton, {
										icon: Icons.Edit,
										title: "edit_action",
										click: () => {
											ctx.controller.setStep(0)
										},
									})
								},
							}),

							m(LoginTextField, {
								label: "paymentMethod_label",
								value: getPaymentMethodName(data.paymentData.paymentMethod),
								isReadOnly: true,
								class: "",
								leadingIcon: {
									icon: data.paymentData.paymentMethod === PaymentMethodType.Paypal ? Icons.Paypal : Icons.CreditCard,
									color: theme.on_surface_variant,
								},
								injectionsRight: () => {
									return m(IconButton, {
										icon: Icons.Edit,
										title: "edit_action",
										click: () => {
											ctx.controller.setStep(2)
										},
									})
								},
							}),
							data.invoiceData.country &&
								m(LoginTextField, {
									label: "billingCountry_label",
									value: data.invoiceData.country.n,
									isReadOnly: true,
									class: "",
									leadingIcon: {
										icon: Icons.Pin,
										color: theme.on_surface_variant,
									},
									injectionsRight: () => {
										return m(IconButton, {
											icon: Icons.Edit,
											title: "edit_action",
											click: () => {
												ctx.controller.setStep(2)
											},
										})
									},
								}),
							m(LoginTextField, {
								label: "paymentInterval_label",
								value: subscription,
								isReadOnly: true,
								class: "",
								leadingIcon: {
									icon: Icons.Refresh,
									color: theme.on_surface_variant,
								},

								injectionsRight: () => {
									return m(IconButton, {
										icon: Icons.Edit,
										title: "edit_action",
										click: () => {
											ctx.controller.setStep(0)
										},
									})
								},
							}),
							!isAppStorePayment &&
								m.fragment({}, [
									isFirstMonthForFree &&
										m(LoginTextField, {
											label: lang.getTranslation("priceTill_label", {
												"{date}": formatDate(DateTime.now().plus({ month: 1 }).toJSDate()),
											}),
											value: formatPrice(0, true),
											isReadOnly: true,
											class: "",
											leadingIcon: {
												icon: Icons.WalletOutline,
												color: theme.on_surface_variant,
											},
										}),
									m(LoginTextField, {
										label: this.buildPriceLabel(isYearly, ctx),
										value: buildPriceString(data.price?.displayPrice ?? "0", data.options),
										isReadOnly: true,
										class: "",
										leadingIcon: {
											icon: Icons.WalletOutline,
											color: theme.on_surface_variant,
										},
									}),
									this.renderPriceNextYear(data),
								]),
						],
					),
					m(
						".flex-center.full-width.pt-32.pb-32",
						m(LoginButton, {
							size: "md",
							label: isAppStorePayment ? "checkoutWithAppStore_action" : "buy_action",
							class: "small-login-button",
							onclick: () => this.upgrade(ctx),
						}),
					),
					m(
						".small.text-left",
						data.options.businessUse()
							? lang.get("pricing.subscriptionPeriodInfoBusiness_msg")
							: lang.get("pricing.subscriptionPeriodInfoPrivate_msg"),
					),
				]),
				!styles.isMobileLayout() &&
					m(
						".flex-grow",
						m("img.block.full-width", {
							style: { "max-width": px(400), "margin-inline": "auto" },
							src: `${window.tutao.appState.prefixWithoutFile}/images/signup/placeholder.svg`,
							alt: "",
							rel: "noreferrer",
							loading: "lazy",
							decoding: "async",
						}),
					),
			]),
		])
	}

	private async upgrade(ctx: WizardStepContext<SignupViewModel>) {
		// We return early because we do the upgrade after the user has submitted payment which is on the confirmation page
		if (ctx.viewModel.paymentData.paymentMethod === PaymentMethodType.AppStore) {
			const success = await this.handleAppStorePayment(ctx.viewModel)
			if (!success) {
				return
			}
		}

		const serviceData = createSwitchAccountTypePostIn({
			accountType: AccountType.PAID,
			customer: null,
			plan: ctx.viewModel.targetPlanType,
			date: Const.CURRENT_DATE,
			referralCode: ctx.viewModel.referralData?.code ?? null,
			specialPriceUserSingle: null,
			surveyData: null,
			app: client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail,
		})
		showProgressDialog("pleaseWait_msg", locator.serviceExecutor.post(SwitchAccountTypeService, serviceData))
			// Order confirmation (click on Buy), send selected payment method as an enum
			.then(() => ctx.controller.next())
			.catch(
				ofClass(PreconditionFailedError, (e) => {
					Dialog.message(
						lang.makeTranslation(
							"precondition_failed",
							lang.get(getPreconditionFailedPaymentMsg(e.data)) +
								(ctx.viewModel.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""),
						),
					)
				}),
			)
			.catch(
				ofClass(BadGatewayError, () => {
					Dialog.message(
						lang.makeTranslation(
							"payment_failed",
							lang.get("paymentProviderNotAvailableError_msg") +
								(ctx.viewModel.upgradeType === UpgradeType.Signup ? " " + lang.get("accountWasStillCreated_msg") : ""),
						),
					)
				}),
			)
	}

	/** @return whether subscribed successfully */
	private async handleAppStorePayment(data: SignupViewModel): Promise<boolean> {
		if (!locator.logins.isUserLoggedIn()) {
			await locator.logins.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, SessionType.Temporary)
		}

		const customerId = locator.logins.getUserController().user.customer!
		const customerIdBytes = base64ToUint8Array(base64ExtToBase64(customerId))

		try {
			const result = await showProgressDialog(
				"pleaseWait_msg",
				locator.mobilePaymentsFacade.requestSubscriptionToPlan(appStorePlanName(data.targetPlanType), data.options.paymentInterval(), customerIdBytes),
			)
			if (result.result !== MobilePaymentResultType.Success) {
				return false
			}
		} catch (e) {
			if (e instanceof MobilePaymentError) {
				console.error("AppStore subscription failed", e)
				Dialog.message("appStoreSubscriptionError_msg", e.message)
				return false
			} else {
				throw e
			}
		}

		return await updatePaymentData(
			data.options.paymentInterval(),
			data.invoiceData,
			data.paymentData,
			null,
			data.newAccountData != null,
			null,
			data.accountingInfo!,
		)
	}

	private renderPriceNextYear(data: SignupViewModel) {
		return data.nextYearPrice
			? m(LoginTextField, {
					label: "priceForNextYear_label",
					value: buildPriceString(data.nextYearPrice.displayPrice, data.options),
					isReadOnly: true,
					class: "",
					leadingIcon: {
						icon: Icons.WalletOutline,
						color: theme.on_surface_variant,
					},
				})
			: null
	}

	private buildPriceLabel(isYearly: boolean, ctx: WizardStepContext<SignupViewModel>): MaybeTranslation {
		if (ctx.viewModel.planPrices!.getRawPricingData().firstMonthForFreeForYearlyPlan && isYearly) {
			return lang.getTranslation("priceFrom_label", {
				"{date}": formatDate(
					DateTime.now()
						.plus({
							month: 1,
							day: 1,
						})
						.toJSDate(),
				),
			})
		}

		if (isYearly && ctx.viewModel.nextYearPrice) {
			return "priceFirstYear_label"
		}

		return "price_label"
	}

	private close(ctx: WizardStepContext<SignupViewModel>) {}
}

function buildPriceString(price: string, options: SelectedSubscriptionOptions): string {
	return formatPriceWithInfo(price, options.paymentInterval(), !options.businessUse())
}
