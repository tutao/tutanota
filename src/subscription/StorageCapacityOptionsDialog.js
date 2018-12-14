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
import {createBookingServiceData} from "../api/entities/sys/BookingServiceData"
import {PreconditionFailedError} from "../api/common/error/RestError"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {ButtonN} from "../gui/base/ButtonN"
import * as BuyDialog from "./BuyDialog"

export function buyStorage(amount: number): Promise<void> {
	const bookingData = createBookingServiceData()
	bookingData.amount = amount.toString()
	bookingData.featureType = BookingItemFeatureType.Storage
	bookingData.date = Const.CURRENT_DATE
	return serviceRequestVoid(SysService.BookingService, HttpMethod.POST, bookingData)
		.catch(PreconditionFailedError, error => {
			return Dialog.error("storageCapacityTooManyUsedForBooking_msg")
		})
}

export function show(): Promise<void> {
	return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
		.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		.then(customerInfo => {
			let freeStorageCapacity = Math.max(Number(customerInfo.includedStorageCapacity), Number(customerInfo.promotionStorageCapacity))
			return Promise.fromCallback((callback) => {
				const changeStorageCapacityAction = (amount: number) => {
					dialog.close()
					BuyDialog.show(BookingItemFeatureType.Storage, amount, freeStorageCapacity, false).then(confirm => {
						if (confirm) {
							return buyStorage(amount)
						}
					}).then(() => {
						callback(null)
					})
				}

				const cancelAction = () => {
					dialog.close()
					callback(null)
				}

				const storageBuyOptionsAttrs = [
					createStorageCapacityBoxAttr(0, freeStorageCapacity, changeStorageCapacityAction),
					createStorageCapacityBoxAttr(10, freeStorageCapacity, changeStorageCapacityAction),
					createStorageCapacityBoxAttr(100, freeStorageCapacity, changeStorageCapacityAction),
					createStorageCapacityBoxAttr(1000, freeStorageCapacity, changeStorageCapacityAction),
				].filter(scb => scb.amount === 0 || scb.amount > freeStorageCapacity).map(scb => scb.buyOptionBoxAttr) // filter needless buy options

				const headerBar = new DialogHeaderBar()
					.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
					.setMiddle(() => lang.get("storageCapacity_label"))
				const dialog = Dialog.largeDialog(headerBar, {
					view: () => [
						m(".pt.center", lang.get("buyStorageCapacityInfo_msg")),
						m(".flex-center.flex-wrap", storageBuyOptionsAttrs.map(attr => m(BuyOptionBox, attr)))
					]
				}).addShortcut({
					key: Keys.ESC,
					exec: cancelAction,
					help: "close_alt"
				}).setCloseHandler(cancelAction)
				                     .show()
			})

		})
}

function createStorageCapacityBoxAttr(amount: number, freeAmount: number, buyAction: (amount: number) => void): {amount: number, buyOptionBoxAttr: BuyOptionBoxAttr} {
	let attrs = {
		heading: formatStorageCapacity(Math.max(amount, freeAmount)),
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

	worker.getPrice(BookingItemFeatureType.Storage, amount, false).then(newPrice => {
		if (amount === getCountFromPriceData(newPrice.currentPriceNextPeriod, BookingItemFeatureType.Storage)) {
			attrs.actionButton = getActiveSubscriptionActionButtonReplacement()
		}
		let price = formatPrice(getPriceFromPriceData(newPrice.futurePriceNextPeriod, BookingItemFeatureType.Storage), true)
		attrs.price = price
		attrs.originalPrice = price
		attrs.helpLabel = (neverNull(newPrice.futurePriceNextPeriod).paymentInterval === "12") ? "pricing.perYear_label" : "pricing.perMonth_label"
		m.redraw()
	})
	return {amount, buyOptionBoxAttr: attrs}
}

function formatStorageCapacity(amount: number): string {
	if (amount < 1000) {
		return amount + " GB";
	} else {
		return (amount / 1000) + " TB";
	}
}
