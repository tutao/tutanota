// @flow

import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../../gui/base/Dialog"
import {serviceRequest} from "../../api/main/Entity"
import {logins} from "../../api/main/LoginController"
import type {CustomerInfo} from "../../api/entities/sys/CustomerInfo"
import type {AccountingInfo} from "../../api/entities/sys/AccountingInfo"
import {worker} from "../../api/main/WorkerClient"
import {showProgressDialog} from "../../gui/base/ProgressDialog"
import {GiftCardTypeRef} from "../../api/entities/sys/GiftCard"
import {locator} from "../../api/main/MainLocator"
import type {Country} from "../../api/common/CountryList"
import {getByAbbreviation} from "../../api/common/CountryList"
import {SysService} from "../../api/entities/sys/Services"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {GiftCardGetReturnTypeRef} from "../../api/entities/sys/GiftCardGetReturn"
import type {GiftCardOption} from "../../api/entities/sys/GiftCardOption"
import {HtmlEditor, Mode} from "../../gui/base/HtmlEditor"
import {DropDownSelector} from "../../gui/base/DropDownSelector"
import {createCountryDropdown} from "../../gui/base/GuiUtils"
import {BuyOptionBox} from "../BuyOptionBox"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {formatPrice, getUpgradePrice, SubscriptionType, UpgradePriceType} from "../SubscriptionUtils"
import {
	GiftCardMessageEditorField,
	renderAcceptGiftCardTermsCheckbox,
	showGiftCardToShare
} from "./GiftCardUtils"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {UserError} from "../../api/common/error/UserError"
import {Keys, PaymentMethodType} from "../../api/common/TutanotaConstants"
import {lang} from "../../misc/LanguageViewModel"
import {NotAuthorizedError, PreconditionFailedError} from "../../api/common/error/RestError"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {CheckboxN} from "../../gui/base/CheckboxN"
import {loadUpgradePrices} from "../UpgradeSubscriptionWizard"
import {Icons} from "../../gui/base/icons/Icons"
import {Icon} from "../../gui/base/Icon"

export type CreateGiftCardViewAttrs = {
	purchaseLimit: number,
	purchasePeriodMonths: number,
	availablePackages: Array<GiftCardOption>;
	initiallySelectedPackage: number;
	message: string;
	country: ?Country;
	outerDialog: lazy<Dialog>,
	premiumPrice: number
}

class GiftCardCreateView implements MComponent<CreateGiftCardViewAttrs> {

	countrySelector: DropDownSelector<?Country>
	message: Stream<string>
	selectedPackage: Stream<number>
	selectedCountry: Stream<?Country>

	isConfirmed: Stream<boolean>

	constructor(vnode: Vnode<CreateGiftCardViewAttrs>) {
		const a = vnode.attrs
		this.selectedPackage = stream(a.initiallySelectedPackage)
		this.selectedCountry = stream(a.country)
		this.message = stream(a.message)

		this.countrySelector = createCountryDropdown(
			this.selectedCountry,
			() => lang.get("invoiceCountryInfoConsumer_msg"),
			"selectRecipientCountry_msg")

		this.isConfirmed = stream(false)

	}

	view(vnode: Vnode<CreateGiftCardViewAttrs>): Children {
		const a = vnode.attrs
		return [
			m(".flex-center",
				m(".pt-l", {style: {maxWidth: "620px"}},
					lang.get("buyGiftCardDescription_msg"))),
			m(".flex.center-horizontally.wrap",
				a.availablePackages.map((option, index) => {
						const value = parseFloat(option.value)
						const withSubscriptionAmount = value - a.premiumPrice
						return m(BuyOptionBox, {
							heading: m(".flex-center",
								Array(Math.pow(2, index)).fill(m(Icon, {icon: Icons.Gift, large: true}))
							),
							actionButton: () => {
								return {
									label: "pricing.select_action",
									click: () => {
										this.selectedPackage(index)
									},
									type: ButtonType.Login,
								}
							},
							price: formatPrice(parseFloat(value), true),
							originalPrice: formatPrice(parseFloat(value), true),
							helpLabel: () => lang.get(withSubscriptionAmount
							=== 0 ? "giftCardOptionTextA_msg" : "giftCardOptionTextB_msg", {
								"{remainingCredit}": formatPrice(withSubscriptionAmount, true),
								"{fullCredit}": formatPrice(value, true)
							}),
							features: () => [],
							width: 230,
							height: 250,
							paymentInterval: null,
							highlighted: this.selectedPackage() === index,
							showReferenceDiscount: false,
						})
					}
				)),
			m(".flex-center", m("", m(GiftCardMessageEditorField, {message: this.message}))),
			m(".flex-center", m("", {style: {maxWidth: "620px"}}, m(this.countrySelector))),
			m(".flex-center.full-width.pt-m", m("", {style: {maxWidth: "620px"}}, renderAcceptGiftCardTermsCheckbox(this.isConfirmed))),
			m(".flex-center.full-width.pt-m", m("", {style: {width: "260px"}}, m(ButtonN, {
					label: "buy_action",
					click: () => this.buyButtonPressed(a),
					type: ButtonType.Login,
				})
			))
		]
	}

	buyButtonPressed(attrs: CreateGiftCardViewAttrs) {
		if (!this.isConfirmed()) {
			Dialog.error("termsAcceptedNeutral_msg");
			return
		}

		const value = attrs.availablePackages[this.selectedPackage()].value
		// replace multiple new lines
		const message = this.message()
		const country = this.selectedCountry()

		if (!country) {
			Dialog.error("selectRecipientCountry_msg")
			return
		}

		showProgressDialog("loading_msg",
			worker.generateGiftCard(message, value, country.a)
			      .then(createdGiftCardId => locator.entityClient.load(GiftCardTypeRef, createdGiftCardId)))
			.then(giftCard => {
				attrs.outerDialog().close()
				showGiftCardToShare(giftCard)
			})
			.catch(PreconditionFailedError, e => {
				switch (e.data) {
					case "giftcard.limitreached":
						throw new UserError(() => lang.get("tooManyGiftCards_msg", {
							"{amount}": `${attrs.purchaseLimit}`,
							"{period}": `${attrs.purchasePeriodMonths} months`
						}))
					case "giftcard.noaccountinginfo":
						throw new UserError("providePaymentDetails_msg")
					case "giftcard.invalidpaymentmethod":
						throw new UserError("invalidGiftCardPaymentMethod_msg")
					default:
						throw e // If this happens then the server changed and we need to handle it
				}
			})
			.catch(NotAuthorizedError, e => {
				throw new UserError("giftCardPurchaseFailed_msg")
			})
			.catch(UserError, showUserError)
	}
}

/**
 * Create a dialog to buy a giftcard or show error if the user cannot do so
 * @returns {Promise<unknown>|Promise<void>|Promise<Promise<void>>}
 */
export function showPurchaseGiftCardDialog(): Promise<void> {
	const loadDialogPromise =
		logins.getUserController()
		      .loadAccountingInfo()
		      .then(accountingInfo => {
			      // Only allow purchase with supported payment methods
			      if (!accountingInfo || accountingInfo.paymentMethod === PaymentMethodType.Invoice || accountingInfo.paymentMethod
				      === PaymentMethodType.AccountBalance) {
				      throw new UserError("invalidGiftCardPaymentMethod_msg")
			      }
		      })
		      .then(() => Promise.all([
			      serviceRequest(SysService.GiftCardService, HttpMethod.GET, null, GiftCardGetReturnTypeRef),
			      logins.getUserController().loadCustomerInfo(),
			      loadUpgradePrices()
		      ]))
		      .spread((giftCardInfo, customerInfo, prices) => {
			      // User can't buy too many gift cards so we have to load their giftcards in order to check how many they ordered
			      const loadGiftCardsPromise = customerInfo.giftCards
				      ? locator.entityClient.loadAll(GiftCardTypeRef, customerInfo.giftCards.items)
				      : Promise.resolve([])

			      return loadGiftCardsPromise.then(existingGiftCards => {

				      const sixMonthsAgo = new Date()
				      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - parseInt(giftCardInfo.period))
				      const numPurchasedGiftCards = existingGiftCards.filter(giftCard => giftCard.orderDate > sixMonthsAgo).length

				      if (numPurchasedGiftCards >= parseInt(giftCardInfo.maxPerPeriod)) {
					      throw new UserError(() => lang.get("tooManyGiftCards_msg", {
						      "{amount}": giftCardInfo.maxPerPeriod,
						      "{period}": `${giftCardInfo.period} months`
					      }))
				      }

				      return logins.getUserController().loadAccountingInfo().then((accountingInfo: AccountingInfo) => {
					      const priceData = {
						      options: {
							      businessUse: () => false,
							      paymentInterval: () => 12
						      },
						      premiumPrices: prices.premiumPrices,
						      teamsPrices: prices.teamsPrices,
						      proPrices: prices.proPrices
					      }
					      let dialog
					      const attrs: CreateGiftCardViewAttrs = {
						      purchaseLimit: giftCardInfo.maxPerPeriod,
						      purchasePeriodMonths: giftCardInfo.period,
						      availablePackages: giftCardInfo.options,
						      initiallySelectedPackage: Math.floor(giftCardInfo.options.length / 2),
						      message: lang.get("defaultGiftCardMessage_msg"),
						      country: accountingInfo.invoiceCountry
							      ? getByAbbreviation(accountingInfo.invoiceCountry)
							      : null,
						      outerDialog: () => dialog,
						      premiumPrice: getUpgradePrice(priceData, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)
					      };

					      const headerBarAttrs: DialogHeaderBarAttrs = {
						      left: [
							      {
								      label: "close_alt",
								      type: ButtonType.Secondary,
								      click: () => dialog.close()
							      }
						      ],
						      middle: () => lang.get("buyGiftCard_label")
					      }
					      dialog = Dialog.largeDialogN(headerBarAttrs, GiftCardCreateView, attrs)
					                     .addShortcut({
						                     key: Keys.ESC,
						                     exec: () => dialog.close(),
						                     help: "close_alt"
					                     })
					      return dialog
				      })
			      })
		      })

	return showProgressDialog("loading_msg", loadDialogPromise)
		.then(dialog => dialog && dialog.show())
		.catch(UserError, showUserError)
}