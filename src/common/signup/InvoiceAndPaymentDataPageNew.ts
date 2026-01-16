import m, { Children, ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { lang } from "../misc/LanguageViewModel"
import { PaymentMethodType } from "../api/common/TutanotaConstants"
import { Countries, Country, CountryType } from "../api/common/CountryList"
import { LocationServiceGetReturn } from "../api/entities/sys/TypeRefs"
import { locator } from "../api/main/CommonLocator"
import { Dialog } from "../gui/base/Dialog"
import { assertNotNull, LazyLoaded, neverNull } from "@tutao/tutanota-utils"
import { getLazyLoadedPayPalUrl, UpgradeType } from "../subscription/utils/SubscriptionUtils"
import { RadioSelectorOption } from "../gui/base/RadioSelectorItem"
import { RadioSelector, RadioSelectorAttrs } from "../gui/base/RadioSelector"
import { getVisiblePaymentMethods, updatePaymentData, validateInvoiceData, validatePaymentData } from "../subscription/utils/PaymentUtils"
import { WizardStepContext } from "../gui/base/wizard/WizardController"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import { LoginButton } from "../gui/base/buttons/LoginButton"
import { theme } from "../gui/theme"
import { CreditCardInput } from "../subscription/CreditCardInput"
import { renderCountryDropdownNew } from "../gui/base/GuiUtils"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { px, size } from "../gui/size"
import { LocationService } from "../api/entities/sys/Services"
import { LoginTextField } from "../gui/base/LoginTextField"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { PaypalButtonNew } from "../subscription/PaypalButtonNew"
import { styles } from "../gui/styles"
import { TextFieldType } from "../gui/base/TextField"

class InvoiceAndPaymentDataPageNew implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	private _hasClickedNext: boolean = false
	private paypalRequestUrl: LazyLoaded<string>
	private readonly formGap = styles.isMobileLayout() ? ".gap-16" : ".gap-24"

	constructor({
		attrs: {
			ctx: { viewModel },
		},
	}: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		this.paypalRequestUrl = getLazyLoadedPayPalUrl()
	}

	oncreate(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		locator.serviceExecutor.get(LocationService, null).then((location: LocationServiceGetReturn) => {
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

	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>): Children {
		const ctx = vnode.attrs.ctx
		const visiblePaymentMethods = getVisiblePaymentMethods({
			isBusiness: ctx.viewModel.options.businessUse(),
			isBankTransferAllowed: !ctx.viewModel.firstMonthForFreeOfferActive,
			accountingInfo: ctx.viewModel.accountingInfo,
		})

		const options: ReadonlyArray<RadioSelectorOption<PaymentMethodType | null>> = visiblePaymentMethods.map(({ name, value }, index) => ({
			name: lang.makeTranslation("selectorItem" + index, name),
			value,
			renderChild: () => this.renderPaymentMethodForm(ctx, value),
		}))

		return m(`.flex.flex-column.full-width${styles.isMobileLayout() ? ".pt-16" : ""}`, [
			m(
				`h1.font-mdio${styles.isMobileLayout() ? ".h2" : ".h1"}`,
				{
					style: {
						position: "relative",
						top: px(-6),
					},
				},
				lang.get("payment_page_title"),
			),
			m(`p${styles.isMobileLayout() ? ".mb-32" : ""}`, { style: { color: theme.on_surface_variant } }, lang.get("payment_page_subtitle")),
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

	private renderPaymentMethodForm(ctx: WizardStepContext<SignupViewModel>, method: PaymentMethodType): Children {
		switch (method) {
			case PaymentMethodType.Invoice:
				return this.renderInvoiceForm(ctx)
			case PaymentMethodType.CreditCard:
				return this.renderCreditCardForm(ctx)
			case PaymentMethodType.Paypal:
				return this.renderPaypalForm(ctx)
			default:
				throw new ProgrammingError(`unknown payment method for signup: ${method}`)
		}
	}

	private renderCreditCardForm(ctx: WizardStepContext<SignupViewModel>): Children {
		return m(`.flex.col${this.formGap}`, [
			m(CreditCardInput, {
				viewModel: ctx.viewModel.ccViewModel,
			}),
			renderCountryDropdownNew({
				selectedCountry: ctx.viewModel.invoiceData.country,
				onSelectionChanged: (country: Country) => {
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
				m(LoginButton, {
					label: "verifyCreditCard_action",
					size: "md",
					width: styles.isMobileLayout() ? "full" : "flex",
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

	private onAddPaymentData = async (ctx: WizardStepContext<SignupViewModel>) => {
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

	private onPaypalButtonClick = async () => {
		if (this.paypalRequestUrl.isLoaded()) {
			window.open(this.paypalRequestUrl.getLoaded())
		} else {
			showProgressDialog("payPalRedirect_msg", this.paypalRequestUrl.getAsync()).then((url) => window.open(url))
		}
	}
	private renderPaypalForm(ctx: WizardStepContext<SignupViewModel>): Children {
		const isPaypalConnected = !!ctx.viewModel.accountingInfo?.paypalBillingAgreement
		return m(`.flex.col${this.formGap}`, [
			m(`.flex.col${styles.isMobileLayout() ? ".items-center" : ".items-end"}${this.formGap}`, [
				renderCountryDropdownNew({
					selectedCountry: ctx.viewModel.invoiceData.country,
					onSelectionChanged: (country: Country) => {
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
							m(LoginTextField, {
								label: "paymentDataPayPalConnected_msg",
								value: ctx.viewModel.accountingInfo!.paymentMethodInfo!,
								isReadOnly: true,
								class: "",
								leadingIcon: {
									icon: BootIcons.Mail,
									color: theme.on_surface_variant,
								},
							}),
						),
					m(
						"",
						{ style: isPaypalConnected || styles.isMobileLayout() ? { width: "100%" } : { "margin-left": "auto" } },
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
					m(LoginButton, {
						label: "continue_action",
						size: "md",
						width: styles.isMobileLayout() ? "full" : "flex",
						onclick: () => {
							ctx.goNext()
						},
						disabled: !ctx.viewModel.invoiceData.country,
					}),
			]),
		])
	}

	private renderInvoiceForm(ctx: WizardStepContext<SignupViewModel>): Children {
		return m(`.flex.col${this.formGap}`, [
			renderCountryDropdownNew({
				selectedCountry: ctx.viewModel.invoiceData.country,
				onSelectionChanged: (country: Country) => {
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
				`.flex-shrink${styles.isMobileLayout() ? ".align-self-center" : ".align-self-end"}`,
				m(LoginButton, {
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

	private renderBusinessAddressFields(ctx: WizardStepContext<SignupViewModel>): Children {
		return m(".full-width", [
			m(
				"",
				m(LoginTextField, {
					label: "invoiceAddress_label",
					value: ctx.viewModel.invoiceData.invoiceAddress,
					oninput: (value) => {
						ctx.viewModel.invoiceData = { ...ctx.viewModel.invoiceData, invoiceAddress: value }
						ctx.viewModel.accountingInfo!.paypalBillingAgreement = null
					},
					type: TextFieldType.Area,
					minLineCount: 5,
					class: "",
				}),
				m(".small", lang.getTranslationText("invoiceAddressInfoBusiness_msg")),
			),
			this.isVatIdFieldVisible(ctx) &&
				m(LoginTextField, {
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

	private isVatIdFieldVisible(ctx: WizardStepContext<SignupViewModel>): boolean {
		const selectedCountry = ctx.viewModel.invoiceData.country
		return ctx.viewModel.options.businessUse() && selectedCountry != null && selectedCountry.t === CountryType.EU
	}
}

export default InvoiceAndPaymentDataPageNew
