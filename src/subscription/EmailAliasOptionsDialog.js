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


export function buyAliases(amount: number): Promise<void> {
	const bookingData = createBookingServiceData()
	bookingData.amount = amount.toString()
	bookingData.featureType = BookingItemFeatureType.Alias
	bookingData.date = Const.CURRENT_DATE
	return serviceRequestVoid(SysService.BookingService, HttpMethod.POST, bookingData).catch(PreconditionFailedError, error => {
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
						callback(null, null)
					})
				}

				const cancelAction = () => {
					dialog.close()
					callback(null, null)
				}

				const emailAliasesBuyOptions = [
					createEmailAliasPackageBox(0, freeEmailAliases, changeEmailAliasPackageAction),
					createEmailAliasPackageBox(20, freeEmailAliases, changeEmailAliasPackageAction),
					createEmailAliasPackageBox(40, freeEmailAliases, changeEmailAliasPackageAction),
					createEmailAliasPackageBox(100, freeEmailAliases, changeEmailAliasPackageAction),
				].filter(aliasPackage => aliasPackage.amount == 0 || aliasPackage.amount > freeEmailAliases).map(scb => scb.buyOptionBox) // filter needless buy options

				const headerBar = new DialogHeaderBar()
					.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
					.setMiddle(() => lang.get("emailAlias_label"))
				const dialog = Dialog.largeDialog(headerBar, {
					view: () => [
						m(".pt.center", lang.get("buyEmailAliasInfo_msg")),
						m(".flex-center.flex-wrap", emailAliasesBuyOptions.map(so => m(so)))
					]
				})

				dialog.addShortcut({
					key: Keys.ESC,
					exec: cancelAction,
					help: "closeDialog_msg"
				})
				dialog.show()
			})

		})
}

function createEmailAliasPackageBox(amount: number, freeAmount: number, buyAction: (amount: number) => void): {amount:number, buyOptionBox:BuyOptionBox} {
	let buyOptionBox = new BuyOptionBox(() => lang.get("mailAddressAliasesShort_label", {"{amount}": Math.max(amount, freeAmount)}), "choose_action",
		() => buyAction(amount),
		() => [], 230, 240)

	buyOptionBox.setValue(lang.get("emptyString_msg"))
	buyOptionBox.setHelpLabel(lang.get("emptyString_msg"))

	worker.getPrice(BookingItemFeatureType.Alias, amount, false).then(newPrice => {
		const currentCount = getCountFromPriceData(newPrice.currentPriceNextPeriod, BookingItemFeatureType.Alias);
		const price = getPriceFromPriceData(newPrice.futurePriceNextPeriod, BookingItemFeatureType.Alias)
		buyOptionBox.setValue(formatPrice(price, true))
		const paymentInterval = neverNull(newPrice.futurePriceNextPeriod).paymentInterval
		buyOptionBox.setHelpLabel(paymentInterval == "12" ? lang.get("perYear_label") : lang.get("perMonth_label"))
		m.redraw()
	})
	return {amount, buyOptionBox}
}
