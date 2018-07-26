// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {BookingItemFeatureType, Const} from "../api/common/TutanotaConstants"
import {BuyOptionBox} from "./BuyOptionBox"
import {load, serviceRequestVoid} from "../api/main/Entity"
import {worker} from "../api/main/WorkerClient"
import {getCountFromPriceData, getPriceFromPriceData} from "./PriceUtils"
import {neverNull} from "../api/common/utils/Utils"
import {formatPrice} from "../misc/Formatter"
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

export function buyStorage(amount: number): Promise<void> {
	const bookingData = createBookingServiceData()
	bookingData.amount = amount.toString()
	bookingData.featureType = BookingItemFeatureType.Storage
	bookingData.date = Const.CURRENT_DATE
	return serviceRequestVoid(SysService.BookingService, HttpMethod.POST, bookingData).catch(PreconditionFailedError, error => {
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
						callback(null, null)
					})
				}

				const cancelAction = () => {
					dialog.close()
					callback(null, null)
				}

				const storageBuyOptions = [
					createStorageCapacityBox(0, freeStorageCapacity, changeStorageCapacityAction, "buy_action"),
					createStorageCapacityBox(10, freeStorageCapacity, changeStorageCapacityAction, "buy_action"),
					createStorageCapacityBox(100, freeStorageCapacity, changeStorageCapacityAction, "buy_action"),
					createStorageCapacityBox(1000, freeStorageCapacity, changeStorageCapacityAction, "buy_action"),
				].filter(scb => scb.amount === 0 || scb.amount > freeStorageCapacity).map(scb => scb.buyOptionBox) // filter needless buy options

				const headerBar = new DialogHeaderBar()
					.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
					.setMiddle(() => lang.get("storageCapacity_label"))
				const dialog = Dialog.largeDialog(headerBar, {
					view: () => [
						m(".pt.center", lang.get("buyStorageCapacityInfo_msg")),
						m(".flex-center.flex-wrap", storageBuyOptions.map(so => m(so)))
					]
				}).addShortcut({
					key: Keys.ESC,
					exec: cancelAction,
					help: "closeDialog_msg"
				}).setCloseHandler(cancelAction)
					.show()
			})

		})
}

function createStorageCapacityBox(amount: number, freeAmount: number, buyAction: (amount: number) => void, actionId: string = "buy_action"): {amount:number, buyOptionBox:BuyOptionBox} {
	let buyOptionBox = new BuyOptionBox(() => formatStorageCapacity(Math.max(amount, freeAmount)), "select_action",
		() => buyAction(amount),
		() => [], 230, 240)

	buyOptionBox.setValue(lang.get("emptyString_msg"))
	buyOptionBox.setHelpLabel(lang.get("emptyString_msg"))

	worker.getPrice(BookingItemFeatureType.Storage, amount, false).then(newPrice => {
		const currentCount = getCountFromPriceData(newPrice.currentPriceNextPeriod, BookingItemFeatureType.Storage);
		if (amount === currentCount) {
			buyOptionBox.selected = true
		}
		const price = getPriceFromPriceData(newPrice.futurePriceNextPeriod, BookingItemFeatureType.Storage)
		buyOptionBox.setValue(formatPrice(price, true))
		const paymentInterval = neverNull(newPrice.futurePriceNextPeriod).paymentInterval
		buyOptionBox.setHelpLabel(paymentInterval === "12" ? lang.get("perYear_label") : lang.get("perMonth_label"))
		m.redraw()
	})
	return {amount, buyOptionBox}
}

function formatStorageCapacity(amount: number): string {
	if (amount < 1000) {
		return amount + " GB";
	} else {
		return (amount / 1000) + " TB";
	}
}
