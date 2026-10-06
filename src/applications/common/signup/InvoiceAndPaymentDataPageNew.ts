import m, { Children, ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../../../ui/base/wizard/WizardStep"
import type { PaymentDetailsModel } from "../subscription/PaymentDetailsModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { locator } from "../api/main/CommonLocator"
import { Dialog } from "../../../ui/base/Dialog"
import { assertNotNull, LazyLoaded, neverNull } from "@tutao/utils"
import { getLazyLoadedPayPalUrl, UpgradeType } from "../subscription/utils/SubscriptionUtils"
import { RadioSelectorOption } from "../../../ui/base/RadioSelectorItem"
import { RadioSelector, RadioSelectorAttrs } from "../../../ui/base/RadioSelector"
import { getVisiblePaymentMethods, updatePaymentData, validateInvoiceData, validatePaymentData } from "../subscription/utils/PaymentUtils"
import { WizardStepContext } from "../../../ui/base/wizard/WizardController"
import { ProgrammingError } from "@tutao/app-env"
import { PrimaryButton, SecondaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import { theme } from "../../../ui/theme"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../ui/base/InfoBanner.js"
import { CreditCardInput } from "../subscription/CreditCardInput"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { px, size } from "../../../ui/size"
import { TextField } from "../../../ui/base/TextField"
import { PaypalButtonNew } from "../subscription/PaypalButtonNew"
import { Styles } from "../../../ui/styles"
import { LegacyTextFieldType } from "../../../ui/base/LegacyTextField"
import { Icons } from "../../../ui/base/icons/Icons"
import { LocationService_GET, LocationServiceGetReturn } from "@tutao/entities/sys"
import { PaymentDataInput, PaymentMethodType } from "../../../entities/sys/Utils"
import { renderCountryDropdownNew } from "../gui/CountryDropdown"
import { Countries, Country, CountryType } from "../gui/CountryList"
import { NULL_ENTITY } from "@tutao/meta"
import { windowFacade } from "../misc/WindowFacade"

class InvoiceAndPaymentDataPageNew implements ClassComponent<WizardStepComponentAttrs<PaymentDetailsModel>> {
	private _hasClickedNext: boolean = false
	private paypalRequestUrl: LazyLoaded<string>
	private readonly formGap = Styles.get().isMobileLayout() ? ".gap-16" : ".gap-24"

	constructor({
		attrs: {
			ctx: { viewModel },
		},
	}: Vnode<WizardStepComponentAttrs<PaymentDetailsModel>>) {
		this.paypalRequestUrl = getLazyLoadedPayPalUrl()
	}

	oncreate(vnode: Vnode<WizardStepComponentAttrs<PaymentDetailsModel>>) {
		locator.serviceExecutor.execute(LocationService_GET, NULL_ENTITY, null).then((location: LocationServiceGetReturn) => {
			if (!vnode.attrs.ctx.viewModel.invoiceData.country) {
				const country = Countries.find((c) => c.a === location.country)

				if (country) {
					vnode.attrs.ctx.viewModel.invoiceData.country = country
					m.redraw()
				}
			}
		})
		m.redraw()
	}

	view(vnode: Vnode<WizardStepComponentAttrs<PaymentDetailsModel>>): Children {
		const ctx = vnode.attrs.ctx
		const visiblePaymentMethods = getVisiblePaymentMethods({
			isBusiness: ctx.viewModel.options.businessUse(),
			isBankTransferAllowed: !ctx.viewModel.firstMonthForFreeOfferActive,
			accountingInfo: ctx.viewModel.accountingInfo,
			upgradeType: ctx.viewModel.upgradeType,
		})

		const options: ReadonlyArray<RadioSelectorOption<PaymentMethodType>> = visiblePaymentMethods.map(({ name, value }, index) => ({
			name: lang.makeTranslation("selectorItem" + index, name),
			value: value.paymentMethod,
			renderChild: () => this.renderPaymentMethodForm(ctx, value.form, value.paymentMethod),
		}))

		return m(`.flex.flex-column.full-width${Styles.get().isMobileLayout() ? ".pt-16" : ""}`, [
			ctx.viewModel.upgradeType !== UpgradeType.Switch && [
				m(
					`h1.font-mdio${Styles.get().isMobileLayout() ? ".h2" : ".h1"}`,
					{
						style: {
							position: "relative",
							top: px(-6),
						},
					},
					lang.get("payment_page_title"),
				),
				m(`p${Styles.get().isMobileLayout() ? ".mb-32" : ""}`, { style: { color: theme.on_surface_variant } }, lang.get("payment_page_subtitle")),
			],
			m(".flex.gap-16", [
				m(
					".flex-grow",
					{
						style: {
							width: `calc(50% - ${px(size.spacing_32)})`,
						},
					},
					m(RadioSelector, {
						groupName: "credentialsEncryptionMode_label",
						options,
						selectedOption: options.some((e) => e.value === ctx.viewModel.paymentData.paymentMethod)
							? ctx.viewModel.paymentData.paymentMethod
							: options[0].value,
						onOptionSelected: (method: PaymentMethodType | null) => {
							if (method == null) {
								// Theoretically this can never happen. We fall back to Credit Card just in case
								ctx.viewModel.paymentData.paymentMethod = PaymentMethodType.CreditCard
								ctx.markComplete(false)
								return
							}
							if (method !== ctx.viewModel.paymentData.paymentMethod) {
								ctx.viewModel.paymentData.paymentMethod = method
								ctx.markComplete(false)
							}
						},
					} satisfies RadioSelectorAttrs<PaymentMethodType | null>),
				),
			]),
		])
	}

	private renderPaymentMethodForm(ctx: WizardStepContext<PaymentDetailsModel>, form: PaymentDataInput, method: PaymentMethodType): Children {
		switch (form) {
			case PaymentDataInput.AccountBalance:
				return this.renderInvoiceForm(ctx, method === PaymentMethodType.Invoice)
			case PaymentDataInput.Paypal:
				return this.renderPaypalForm(ctx)
			case PaymentDataInput.CreditCard:
				return this.renderCreditCardForm(ctx)
			case PaymentDataInput.Other:
				return this.renderOtherPaymentForm(ctx)
			default:
				throw new ProgrammingError(`unknown payment method: ${method}`)
		}
	}

	private renderCreditCardForm(ctx: WizardStepContext<PaymentDetailsModel>): Children {
		return m(`.flex.col${this.formGap}`, [
			m(CreditCardInput, {
				viewModel: ctx.viewModel.ccViewModel,
			}),
			renderCountryDropdownNew({
				selectedCountry: ctx.viewModel.invoiceData.country,
				onSelectionChanged: (country: Country | null) => {
					if (country == null) return
					ctx.viewModel.updateInvoiceCountry(country)
					ctx.markComplete(false)

					if (country.t !== CountryType.EU) {
						ctx.viewModel.invoiceData.vatNumber = ""
					}
				},
				label: "billingCountry_label",
			}),

			ctx.viewModel.options.businessUse() && this.renderBusinessAddressFields(ctx),
			m(
				".flex-shrink.justify-end.mt-16",
				m(PrimaryButton, {
					label: "verifyCreditCard_action",
					size: "md",
					width: Styles.get().isMobileLayout() ? "full" : "flex",
					onclick: () => {
						this.onAddPaymentData(ctx)
					},
					style: {
						"margin-left": "auto",
					},
					disabled: !ctx.viewModel.invoiceData.country,
				}),
			),
		])
	}

	private onAddPaymentData = async (ctx: WizardStepContext<PaymentDetailsModel>) => {
		// const invoiceDataInput = assertNotNull(this._invoiceDataInput)

		const data = ctx.viewModel

		const error =
			validateInvoiceData({
				address: data.invoiceData.invoiceAddress,
				isBusiness: data.options.businessUse(),
			}) ||
			validatePaymentData({
				country: data.invoiceData.country,
				isBusiness: data.options.businessUse(),
				paymentMethod: data.paymentData.paymentMethod,
				accountingInfo: assertNotNull(data.accountingInfo),
			})

		if (error) {
			await Dialog.message(error)
			return
		}

		// data.invoiceData = invoiceDataInput.getInvoiceData()
		data.paymentData = {
			paymentMethod: data.paymentData.paymentMethod,
			creditCardData: data.paymentData.paymentMethod === PaymentMethodType.CreditCard ? data.ccViewModel.getCreditCardData() : null,
		}

		const progress = (async () => {
			const customer = neverNull(data.customer)
			const businessUse = data.options.businessUse()

			if (customer.businessUse !== businessUse) {
				customer.businessUse = businessUse
				await locator.entityClient.update(customer)
			}

			const success = await updatePaymentData(
				data.options.paymentInterval(),
				data.invoiceData,
				data.paymentData,
				null,
				data.upgradeType === UpgradeType.Signup,
				neverNull(data.price?.rawPrice),
				neverNull(data.accountingInfo),
			)
			if (!success) ctx.viewModel.accountingInfo!.paypalBillingAgreement = null

			if (success && !this._hasClickedNext) {
				this._hasClickedNext = true
				ctx.goNext()
			}
		})()

		void showProgressDialog("updatePaymentDataBusy_msg", progress)
	}

	private renderOtherPaymentForm(ctx: WizardStepContext<PaymentDetailsModel>): Children {
		return m(`.flex.col${this.formGap}`, [
			m(
				`.flex-shrink${Styles.get().isMobileLayout() ? ".align-self-center" : ".align-self-end"}`,
				m("", [
					m(".h4.pb-8", "ProxyStore"),
					m(".small.pb-8", lang.getTranslationText("proxyStorePayment_msg")),
					m(SecondaryButton, {
						label: lang.getTranslation("openProxystore_action"),
						width: "flex",
						icon: Icons.OpenOutline,
						onclick: async () => {
							const choice = await Dialog.confirm("afterProxyStoreAction_msg")
							if (choice) {
								windowFacade.openLink("https://digitalgoods.proxysto.re/brand/tuta")
							}
						},
					}),
				]),
			),
		])
	}

	private onPaypalButtonClick = async () => {
		if (this.paypalRequestUrl.isLoaded()) {
			windowFacade.openLink(this.paypalRequestUrl.getLoaded())
		} else {
			showProgressDialog("payPalRedirect_msg", this.paypalRequestUrl.getAsync()).then((url) => windowFacade.openLink(url))
		}
	}
	private renderPaypalForm(ctx: WizardStepContext<PaymentDetailsModel>): Children {
		const isPaypalConnected = !!ctx.viewModel.accountingInfo?.paypalBillingAgreement
		return m(`.flex.col${this.formGap}`, [
			m(`.flex.col${Styles.get().isMobileLayout() ? ".items-center" : ".items-end"}${this.formGap}`, [
				renderCountryDropdownNew({
					selectedCountry: ctx.viewModel.invoiceData.country,
					onSelectionChanged: (country: Country | null) => {
						if (country == null) return
						ctx.viewModel.updateInvoiceCountry(country)
						ctx.markComplete(false)
						if (country.t !== CountryType.EU) {
							ctx.viewModel.invoiceData.vatNumber = ""
						}
					},
					label: "billingCountry_label",
				}),
				ctx.viewModel.options.businessUse() && this.renderBusinessAddressFields(ctx),
				m(`.flex.justify-between.full-width${this.formGap}.wrap`, [
					isPaypalConnected &&
						m(
							".flex-grow",
							{ style: { "min-width": "fit-content" } },
							m(TextField, {
								label: "paymentDataPayPalConnected_msg",
								value: ctx.viewModel.accountingInfo!.paymentMethodInfo!,
								isReadOnly: true,
								class: "",
								leadingIcon: {
									icon: Icons.MailFilled,
									color: theme.on_surface_variant,
								},
							}),
						),
					m(
						"",
						{ style: isPaypalConnected || Styles.get().isMobileLayout() ? { width: "100%" } : { "margin-left": "auto" } },
						m(PaypalButtonNew, {
							data: ctx.viewModel,
							onclick: async () => {
								const error = validateInvoiceData({
									address: ctx.viewModel.invoiceData.invoiceAddress,
									isBusiness: ctx.viewModel.options.businessUse(),
								})

								if (error) {
									await Dialog.message(error)
									return
								}
								this.onPaypalButtonClick()
							},
							oncomplete: () => this.onAddPaymentData(ctx),
							disabled: !ctx.viewModel.invoiceData.country,
						}),
					),
				]),
				m(
					"div.border-radius-8.smaller.align-self-start",
					lang.getTranslationText(isPaypalConnected ? "paymentDataPayPalChangeAccount_msg" : "paymentDataPayPalLogin_msg"),
				),
				isPaypalConnected &&
					m(PrimaryButton, {
						label: "continue_action",
						size: "md",
						width: Styles.get().isMobileLayout() ? "full" : "flex",
						onclick: () => {
							this.onAddPaymentData(ctx)
						},
						disabled: !ctx.viewModel.invoiceData.country,
					}),
			]),
		])
	}

	private renderInvoiceForm(ctx: WizardStepContext<PaymentDetailsModel>, showBankTransferInfo: boolean = true): Children {
		return m(`.flex.col${this.formGap}`, [
			renderCountryDropdownNew({
				selectedCountry: ctx.viewModel.invoiceData.country,
				onSelectionChanged: (country: Country | null) => {
					if (country == null) return
					ctx.viewModel.updateInvoiceCountry(country)
					ctx.markComplete(false)
					if (country.t !== CountryType.EU) {
						ctx.viewModel.invoiceData.vatNumber = ""
					}
				},
				label: "billingCountry_label",
			}),
			ctx.viewModel.options.businessUse() && this.renderBusinessAddressFields(ctx),
			showBankTransferInfo && this.renderBankTransferInfo(),
			m(
				`.flex-shrink${Styles.get().isMobileLayout() ? ".align-self-center" : ".align-self-end"}`,
				m(PrimaryButton, {
					label: "continue_action",
					size: "md",
					width: "flex",
					onclick: () => {
						this.onAddPaymentData(ctx)
					},
					disabled: !ctx.viewModel.invoiceData.country,
				}),
			),
		])
	}

	private renderBankTransferInfo(): Children {
		const [title, ...steps] = lang.get("paymentMethodOnAccountHowItWorks_msg").split("\n")

		return m(InfoBanner, {
			message: () =>
				m(".text-break.mb-4", [
					m(".b.mb-8", title),
					m(
						"ol.mb-0",
						{
							style: { paddingLeft: px(size.spacing_16) },
						},
						steps.map((step, index) => m("li", { style: index < steps.length - 1 ? { marginBottom: px(size.spacing_8) } : undefined }, step)),
					),
				]),
			icon: Icons.InfoFilled,
			type: BannerType.Info,
			buttons: [],
		} satisfies InfoBannerAttrs)
	}

	private renderBusinessAddressFields(ctx: WizardStepContext<PaymentDetailsModel>): Children {
		return m(".full-width", [
			m(
				"",
				m(TextField, {
					label: "invoiceAddress_label",
					value: ctx.viewModel.invoiceData.invoiceAddress,
					oninput: (value) => {
						ctx.viewModel.invoiceData = { ...ctx.viewModel.invoiceData, invoiceAddress: value }
						ctx.viewModel.accountingInfo!.paypalBillingAgreement = null
					},
					type: LegacyTextFieldType.Area,
					minLineCount: 5,
					class: "",
				}),
				m(".small", lang.getTranslationText("invoiceAddressInfoBusiness_msg")),
			),
			this.isVatIdFieldVisible(ctx) &&
				m(TextField, {
					label: "invoiceVatIdNo_label",
					value: ctx.viewModel.invoiceData.vatNumber,
					oninput: (value) => {
						ctx.viewModel.invoiceData = { ...ctx.viewModel.invoiceData, vatNumber: value }
						ctx.viewModel.accountingInfo!.paypalBillingAgreement = null
					},
					helpLabel: () => lang.getTranslationText("invoiceVatIdNoInfoBusiness_msg"),
				}),
		])
	}

	private isVatIdFieldVisible(ctx: WizardStepContext<PaymentDetailsModel>): boolean {
		const selectedCountry = ctx.viewModel.invoiceData.country
		return ctx.viewModel.options.businessUse() && selectedCountry != null && selectedCountry.t === CountryType.EU
	}
}

export default InvoiceAndPaymentDataPageNew
