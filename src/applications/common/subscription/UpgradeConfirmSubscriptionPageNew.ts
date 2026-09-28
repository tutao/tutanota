import m, { Children, ClassComponent, Vnode } from "mithril"
import { lang, MaybeTranslation } from "../../../ui/utils/LanguageViewModel"
import { formatPrice, formatPriceWithInfo, getPaymentMethodName, PaymentInterval } from "./utils/PriceUtils"
import { AvailablePlanType, isExternalPaymentMethod, PaymentMethodType, PlanType } from "../../../entities/sys/Utils"
import { getDisplayNameOfPlanType, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import { DateTime } from "luxon"
import { formatDate } from "../../../ui/utils/Formatter.js"
import { WizardStepContext } from "../../../ui/base/wizard/WizardController"
import type { OrderConfirmationModel } from "./OrderConfirmationModel"
import { theme } from "../../../ui/theme"
import { TextField } from "../../../ui/base/TextField"
import { Icons } from "../../../ui/base/icons/Icons"
import { IconButton } from "../../../ui/base/IconButton"
import { Styles } from "../../../ui/styles"
import { WizardStepComponentAttrs } from "../../../ui/base/wizard/WizardStep"
import { AllIcons } from "../../../ui/base/Icon"
import { px } from "../../../ui/size"

export interface OrderConfirmationPageAttrs extends WizardStepComponentAttrs<OrderConfirmationModel> {
	onEditPlan: () => void
	onEditPayment: () => void
	onPaymentIntervalChanged: () => void
	onConfirm: () => Promise<boolean>
}

export const PlanTypeToIcon: Record<AvailablePlanType, AllIcons> = {
	[PlanType.Free]: Icons.Revolutionary,
	[PlanType.Revolutionary]: Icons.Revolutionary,
	[PlanType.Legend]: Icons.Legendary,
	[PlanType.Essential]: Icons.HouseOutline,
	[PlanType.Advanced]: Icons.StoreOutline,
	[PlanType.Unlimited]: Icons.CityOutline,
}
export class UpgradeConfirmSubscriptionPageNew implements ClassComponent<OrderConfirmationPageAttrs> {
	view({ attrs }: Vnode<OrderConfirmationPageAttrs>): Children {
		const { ctx } = attrs
		const data = ctx.viewModel
		const isYearly = data.options.paymentInterval() === PaymentInterval.Yearly
		const subscription = isYearly ? lang.get("pricing.yearly_label") : lang.get("pricing.monthly_label")

		const isFirstMonthForFree = data.planPrices!.getRawPricingData().firstMonthForFreeForYearlyPlan && isYearly
		const isExternalPayment = isExternalPaymentMethod(data.paymentData.paymentMethod)
		return m(`.flex.flex-column.full-width${Styles.get().isMobileLayout() ? ".pt-16" : ""}`, [
			m(
				`h1.font-mdio${Styles.get().isMobileLayout() ? ".h2" : ".h1"}`,
				{
					style: {
						position: "relative",
						top: px(-6),
					},
				},
				lang.get("confirm_order_page_title"),
			),
			m(`p${Styles.get().isMobileLayout() ? ".mb-32" : ""}`, { style: { color: theme.on_surface_variant } }, lang.get("confirm_order_page_subtitle")),

			m(".flex.gap-16", [
				m(".flex-grow", [
					m(
						`.flex.col.gap-16.pt-16.pb-16.border-radius-16${Styles.get().isMobileLayout() ? "" : ".plr-16"}`,
						{
							style: {
								"background-color": theme.surface_container_high,
								color: theme.on_surface_variant,
							},
						},
						[
							m(TextField, {
								label: "subscription_label",
								value: getDisplayNameOfPlanType(data.targetPlanType),
								isReadOnly: true,
								class: "",
								leadingIcon: {
									icon: PlanTypeToIcon[data.targetPlanType as AvailablePlanType],
									color: theme.on_surface_variant,
								},
								injectionsRight: () => {
									return m(IconButton, {
										icon: Icons.PenFilled,
										label: "edit_action",
										click: attrs.onEditPlan,
									})
								},
							}),

							m(TextField, {
								label: "paymentMethod_label",
								value: getPaymentMethodName(data.paymentData.paymentMethod),
								isReadOnly: true,
								class: "",
								leadingIcon: {
									icon: data.paymentData.paymentMethod === PaymentMethodType.Paypal ? Icons.LogoPaypal : Icons.CreditcardFilled,
									color: theme.on_surface_variant,
								},
								injectionsRight: () => {
									return isExternalPayment
										? undefined
										: m(IconButton, {
												icon: Icons.PenFilled,
												label: "edit_action",
												click: attrs.onEditPayment,
											})
								},
							}),
							data.invoiceData.country &&
								m(TextField, {
									label: "billingCountry_label",
									value: data.invoiceData.country.n,
									isReadOnly: true,
									class: "",
									leadingIcon: {
										icon: Icons.PlaceFilled,
										color: theme.on_surface_variant,
									},
									injectionsRight: () => {
										return m(IconButton, {
											icon: Icons.PenFilled,
											label: "edit_action",
											click: attrs.onEditPayment,
										})
									},
								}),
							m(TextField, {
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
										icon: Icons.Swap,
										label: "edit_action",
										click: () => {
											if (isYearly) {
												data.options.paymentInterval(PaymentInterval.Monthly)
											} else {
												data.options.paymentInterval(PaymentInterval.Yearly)
											}
											attrs.onPaymentIntervalChanged()
										},
									})
								},
							}),
							!isExternalPayment &&
								m.fragment({}, [
									isFirstMonthForFree &&
										m(TextField, {
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
									m(TextField, {
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
						m(PrimaryButton, {
							size: "md",
							label: isExternalPayment
								? ctx.viewModel.paymentData.paymentMethod === PaymentMethodType.AppStore
									? "checkoutWithAppStore_action"
									: "checkoutWithGooglePlay_action"
								: "confirmAndPay_action",
							width: Styles.get().isMobileLayout() ? "full" : "flex",
							onclick: () => this.confirm(attrs),
							style: {
								"margin-left": "auto",
							},
						}),
					),
					m(
						".small.text-left",
						data.options.businessUse()
							? lang.get("pricing.subscriptionPeriodInfoBusiness_msg")
							: lang.get("pricing.subscriptionPeriodInfoPrivate_msg"),
					),
				]),
			]),
		])
	}

	private async confirm({ ctx, onConfirm }: OrderConfirmationPageAttrs): Promise<void> {
		if (await onConfirm()) ctx.goNext()
	}

	private renderPriceNextYear(data: OrderConfirmationModel) {
		return data.nextYearPrice
			? m(TextField, {
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

	private buildPriceLabel(isYearly: boolean, ctx: WizardStepContext<OrderConfirmationModel>): MaybeTranslation {
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
}

function buildPriceString(price: string, options: SelectedSubscriptionOptions): string {
	return formatPriceWithInfo(price, options.paymentInterval(), !options.businessUse())
}
