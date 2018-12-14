// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {BookingItemFeatureType, Const} from "../api/common/TutanotaConstants"
import type {BuyOptionBoxAttr} from "./BuyOptionBox"
import {BuyOptionBox, getActiveSubscriptionActionButtonReplacement} from "./BuyOptionBox"
import {load, serviceRequestVoid} from "../api/main/Entity"
import {worker} from "../api/main/WorkerClient"
import {getCountFromPriceData, getPriceFromPriceData} from "./PriceUtils"
import {neverNull} from "../api/common/utils/Utils"
import {formatPrice} from "../subscription/SubscriptionUtils"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {logins} from "../api/main/LoginController"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Button, ButtonType} from "../gui/base/Button"
import {Dialog} from "../gui/base/Dialog"
import {Keys} from "../misc/KeyManager"
import * as BuyDialog from "./BuyDialog"
import {createBookingServiceData} from "../api/entities/sys/BookingServiceData"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {ButtonN} from "../gui/base/ButtonN"


export function buyAliases(amount: number): Promise<void> {
	const bookingData = createBookingServiceData()
	bookingData.amount = amount.toString()
	bookingData.featureType = BookingItemFeatureType.Alias
	bookingData.date = Const.CURRENT_DATE
	return serviceRequestVoid(SysService.BookingService, HttpMethod.POST, bookingData)
		.catch(PreconditionFailedError, error => {
			return Dialog.error("emailAliasesTooManyActivatedForBooking_msg")
		})
}

export function show(): Promise<void> {
	return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		.then(customerInfo => {
			let freeEmailAliases = Math.max(Number(customerInfo.includedEmailAliases), Number(customerInfo.promotionEmailAliases))
			return Promise.fromCallback((callback) => {
				const changeEmailAliasPackageAction = (amount: number) => {
					dialog.close()
					BuyDialog.show(BookingItemFeatureType.Alias, amount, freeEmailAliases, false).then(confirm => {
						if (confirm) {
							return buyAliases(amount)
						}
					}).then(() => {
						callback(null)
					})
				}

				const cancelAction = () => {
					dialog.close()
					callback(null)
				}

				const emailAliasesBuyOptionsAttrs = [
					createEmailAliasPackageBox(0, freeEmailAliases, changeEmailAliasPackageAction),
					createEmailAliasPackageBox(20, freeEmailAliases, changeEmailAliasPackageAction),
					createEmailAliasPackageBox(40, freeEmailAliases, changeEmailAliasPackageAction),
					createEmailAliasPackageBox(100, freeEmailAliases, changeEmailAliasPackageAction),
				].filter(aliasPackage => aliasPackage.amount === 0 || aliasPackage.amount > freeEmailAliases)
				 .map(scb => scb.buyOptionBoxAttr) // filter needless buy options

				const headerBar = new DialogHeaderBar()
					.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
					.setMiddle(() => lang.get("emailAlias_label"))
				const dialog = Dialog.largeDialog(headerBar, {
					view: () => [
						m(".pt.center", lang.get("buyEmailAliasInfo_msg")),
						m(".flex-center.flex-wrap", emailAliasesBuyOptionsAttrs.map(attr => m(BuyOptionBox, attr)))
					]
				})

				dialog.addShortcut({
					key: Keys.ESC,
					exec: cancelAction,
					help: "close_alt"
				})
				dialog.setCloseHandler(cancelAction)
				dialog.show()
			})

		})
}

function createEmailAliasPackageBox(amount: number, freeAmount: number, buyAction: (amount: number) => void): {amount: number, buyOptionBoxAttr: BuyOptionBoxAttr} {
	let attrs = {
		heading: lang.get("pricing.mailAddressAliasesShort_label", {"{amount}": Math.max(amount, freeAmount)}),
		actionButton: {
			view: () => {
				return m(ButtonN, {
					label: "pricing.select_action",
					type: ButtonType.Login,
					click: () => buyAction(amount)
				})
			}
		},
		price: lang.get("emptyString_msg"),
		originalPrice: lang.get("emptyString_msg"),
		helpLabel: "emptyString_msg",
		features: () => [],
		width: 230,
		height: 210,
		paymentInterval: null,
		showReferenceDiscount: false
	}

	worker.getPrice(BookingItemFeatureType.Alias, amount, false).then(newPrice => {
		if (amount === getCountFromPriceData(newPrice.currentPriceNextPeriod, BookingItemFeatureType.Alias)) {
			attrs.actionButton = getActiveSubscriptionActionButtonReplacement()
		}
		let price = formatPrice(getPriceFromPriceData(newPrice.futurePriceNextPeriod, BookingItemFeatureType.Alias), true)
		attrs.price = price
		attrs.originalPrice = price
		attrs.helpLabel = (neverNull(newPrice.futurePriceNextPeriod).paymentInterval === "12") ? "pricing.perYear_label" : "pricing.perMonth_label"
		m.redraw()
	})
	return {amount, buyOptionBoxAttr: attrs}
}
