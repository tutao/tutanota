import m, { Children, Component, Vnode } from "mithril"
import { Dialog } from "../../gui/base/Dialog"
import type { GiftCard, GiftCardOption } from "../../api/entities/sys/TypeRefs.js"
import { GiftCardTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { locator } from "../../api/main/CommonLocator"
import { BOX_MARGIN, BuyOptionBox } from "../BuyOptionBox"
import { ButtonType } from "../../gui/base/Button.js"
import { getPreconditionFailedPaymentMsg } from "../SubscriptionUtils"
import { renderAcceptGiftCardTermsCheckbox, showGiftCardToShare } from "./GiftCardUtils"
import type { DialogHeaderBarAttrs } from "../../gui/base/DialogHeaderBar"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { UserError } from "../../api/main/UserError"
import { Keys, PaymentMethodType, PlanType } from "../../api/common/TutanotaConstants"
import { lang } from "../../misc/LanguageViewModel"
import { BadGatewayError, PreconditionFailedError } from "../../api/common/error/RestError"
import { GiftCardMessageEditorField } from "./GiftCardMessageEditorField"
import { client } from "../../misc/ClientDetector"
import { count, filterInt, noOp, ofClass } from "@tutao/tutanota-utils"
import { isIOSApp } from "../../api/common/Env"
import { formatPrice, PaymentInterval, PriceAndConfigProvider } from "../PriceUtils"
import { GiftCardService } from "../../api/entities/sys/Services"
import { UpgradePriceType } from "../FeatureListProvider"
import { TranslationKeyType } from "../../misc/TranslationKey.js"
import { px } from "../../gui/size"
import { Icon, IconSize } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"

class PurchaseGiftCardModel {
	message = lang.get("defaultGiftCardMessage_msg")
	confirmed = false

	constructor(
		private readonly config: {
			purchaseLimit: number
			purchasePeriodMonths: number
			availablePackages: Array<GiftCardOption>
			selectedPackage: number
			revolutionaryPrice: number
		},
	) {}

	get availablePackages(): ReadonlyArray<GiftCardOption> {
		return this.config.availablePackages
	}

	get purchaseLimit(): number {
		return this.config.purchaseLimit
	}

	get purchasePeriodMonths(): number {
		return this.config.purchasePeriodMonths
	}

	get selectedPackage(): number {
		return this.config.selectedPackage
	}

	set selectedPackage(selection: number) {
		this.config.selectedPackage = selection
	}

	get revolutionaryPrice(): number {
		return this.config.revolutionaryPrice
	}

	async purchaseGiftCard(): Promise<GiftCard> {
		if (!this.confirmed) {
			throw new UserError("termsAcceptedNeutral_msg")
		}

		return locator.giftCardFacade
			.generateGiftCard(this.message, this.availablePackages[this.selectedPackage].value)
			.then((createdGiftCardId) => locator.entityClient.load(GiftCardTypeRef, createdGiftCardId))
			.catch((e) => this.handlePurchaseError(e))
	}

	private handlePurchaseError(e: Error): never {
		if (e instanceof PreconditionFailedError) {
			const message = e.data

			switch (message) {
				case "giftcard.limitreached":
					throw new UserError(() =>
						lang.get("tooManyGiftCards_msg", {
							"{amount}": `${this.purchaseLimit}`,
							"{period}": `${this.purchasePeriodMonths} months`,
						}),
					)

				case "giftcard.noaccountinginfo":
					throw new UserError("providePaymentDetails_msg")

				case "giftcard.invalidpaymentmethod":
					throw new UserError("invalidGiftCardPaymentMethod_msg")

				default:
					throw new UserError(getPreconditionFailedPaymentMsg(e.data))
			}
		} else if (e instanceof BadGatewayError) {
			throw new UserError("paymentProviderNotAvailableError_msg")
		} else {
			throw e
		}
	}
}

interface GiftCardPurchaseViewAttrs {
	model: PurchaseGiftCardModel
	onGiftCardPurchased: (giftCard: GiftCard) => void
}

class GiftCardPurchaseView implements Component<GiftCardPurchaseViewAttrs> {
	view(vnode: Vnode<GiftCardPurchaseViewAttrs>): Children {
		const { model, onGiftCardPurchased } = vnode.attrs
		return [
			m(
				".flex.center-horizontally.wrap",
				{
					style: {
						"column-gap": px(BOX_MARGIN),
					},
				},
				model.availablePackages.map((option, index) => {
					const value = parseFloat(option.value)

					return m(BuyOptionBox, {
						heading: m(
							".flex-center",
							Array(Math.pow(2, index)).fill(
								m(Icon, {
									icon: Icons.Gift,
									size: IconSize.Medium,
								}),
							),
						),
						actionButton: () =>
							m(LoginButton, {
								label: "pricing.select_action",
								onclick: () => {
									model.selectedPackage = index
								},
							}),
						price: formatPrice(value, true),
						helpLabel: () => this.getGiftCardHelpText(model.revolutionaryPrice, value),
						width: 230,
						height: 250,
						paymentInterval: null,
						highlighted: model.selectedPackage === index,
						showReferenceDiscount: false,
						mobile: false,
						bonusMonths: 0,
					})
				}),
			),
			m(
				".flex-center",
				m(GiftCardMessageEditorField, {
					message: model.message,
					onMessageChanged: (message) => (model.message = message),
				}),
			),
			m(
				".flex-center",
				m(".flex-grow-shrink-auto.max-width-m.pt.pb.plr-l", [
					m(
						".pt",
						renderAcceptGiftCardTermsCheckbox(model.confirmed, (checked) => (model.confirmed = checked)),
					),
					m(
						".mt-l.mb-l",
						m(LoginButton, {
							label: "buy_action",
							onclick: () => this.onBuyButtonPressed(model, onGiftCardPurchased).catch(ofClass(UserError, showUserError)),
						}),
					),
				]),
			),
		]
	}

	async onBuyButtonPressed(model: PurchaseGiftCardModel, onPurchaseSuccess: (giftCard: GiftCard) => void) {
		const giftCard = await showProgressDialog("loading_msg", model.purchaseGiftCard())
		onPurchaseSuccess(giftCard)
	}

	private getGiftCardHelpText(upgradePrice: number, giftCardValue: number): string {
		let helpTextId: TranslationKeyType
		if (giftCardValue < upgradePrice) {
			helpTextId = "giftCardOptionTextC_msg"
		} else if (giftCardValue == upgradePrice) {
			helpTextId = "giftCardOptionTextD_msg"
		} else {
			helpTextId = "giftCardOptionTextE_msg"
		}
		return lang.get(helpTextId, {
			"{remainingCredit}": formatPrice(giftCardValue - upgradePrice, true),
			"{fullCredit}": formatPrice(giftCardValue, true),
		})
	}
}

/**
 * Create a dialog to buy a giftcard or show error if the user cannot do so
 * @returns {Promise<unknown>|Promise<void>|Promise<Promise<void>>}
 */

export async function showPurchaseGiftCardDialog() {
	if (isIOSApp()) {
		return Dialog.message("notAvailableInApp_msg")
	}

	const model = await showProgressDialog("loading_msg", loadGiftCardModel()).catch(
		ofClass(UserError, (e) => {
			showUserError(e)
			return null
		}),
	)

	if (model == null) {
		return
	}

	let dialog: Dialog

	const header: DialogHeaderBarAttrs = {
		left: [
			{
				label: "close_alt",
				type: ButtonType.Secondary,
				click: () => dialog.close(),
			},
		],
		middle: () => lang.get("buyGiftCard_label"),
	}

	const content = {
		view: () =>
			m(GiftCardPurchaseView, {
				model,
				onGiftCardPurchased: (giftCard) => {
					dialog.close()
					showGiftCardToShare(giftCard)
				},
			}),
	}

	dialog = Dialog.largeDialog(header, content).addShortcut({
		key: Keys.ESC,
		exec: () => dialog.close(),
		help: "close_alt",
	})

	if (client.isMobileDevice()) {
		// Prevent focusing text field automatically on mobile. It opens keyboard and you don't see all details.
		dialog.setFocusOnLoadFunction(noOp)
	}

	dialog.show()
}

async function loadGiftCardModel(): Promise<PurchaseGiftCardModel> {
	const accountingInfo = await locator.logins.getUserController().loadAccountingInfo()

	// Only allow purchase with supported payment methods
	if (!accountingInfo || accountingInfo.paymentMethod === PaymentMethodType.Invoice || accountingInfo.paymentMethod === PaymentMethodType.AccountBalance) {
		throw new UserError("invalidGiftCardPaymentMethod_msg")
	}

	const [giftCardInfo, customerInfo] = await Promise.all([
		locator.serviceExecutor.get(GiftCardService, null),
		locator.logins.getUserController().loadCustomerInfo(),
	])

	// User can't buy too many gift cards so we have to load their giftcards in order to check how many they ordered
	const existingGiftCards = customerInfo.giftCards ? await locator.entityClient.loadAll(GiftCardTypeRef, customerInfo.giftCards.items) : []

	const sixMonthsAgo = new Date()
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - parseInt(giftCardInfo.period))
	const numPurchasedGiftCards = count(existingGiftCards, (giftCard) => giftCard.orderDate > sixMonthsAgo)

	if (numPurchasedGiftCards >= parseInt(giftCardInfo.maxPerPeriod)) {
		throw new UserError(() =>
			lang.get("tooManyGiftCards_msg", {
				"{amount}": giftCardInfo.maxPerPeriod,
				"{period}": `${giftCardInfo.period} months`,
			}),
		)
	}

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)
	return new PurchaseGiftCardModel({
		purchaseLimit: filterInt(giftCardInfo.maxPerPeriod),
		purchasePeriodMonths: filterInt(giftCardInfo.period),
		availablePackages: giftCardInfo.options,
		selectedPackage: Math.floor(giftCardInfo.options.length / 2),
		revolutionaryPrice: priceDataProvider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.PlanActualPrice),
	})
}
