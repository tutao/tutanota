import m from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { BookingItemFeatureType, Keys } from "../api/common/TutanotaConstants"
import type { BuyOptionBoxAttr } from "./BuyOptionBox"
import { BuyOptionBox, updateBuyOptionBoxPriceInformation } from "./BuyOptionBox"
import { neverNull } from "@tutao/tutanota-utils"
import { buyStorage } from "./SubscriptionUtils"
import { CustomerInfoTypeRef, CustomerTypeRef } from "../api/entities/sys/TypeRefs.js"
import { Dialog } from "../gui/base/Dialog"
import { Button, ButtonType } from "../gui/base/Button.js"
import type { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import { showBuyDialog } from "./BuyDialog"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import { locator } from "../api/main/MainLocator"

export function showStorageCapacityOptionsDialog(storageWarningTextId?: TranslationKey): Promise<void> {
	const userController = locator.logins.getUserController()

	if (userController.isFreeAccount() || !userController.isGlobalAdmin()) {
		throw new ProgrammingError("changing storage options is only allowed for global admins of premium accounts")
	}

	return locator.entityClient
		.load(CustomerTypeRef, neverNull(userController.user.customer))
		.then((customer) => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
		.then((customerInfo) => {
			let freeStorageCapacity = Math.max(Number(customerInfo.includedStorageCapacity), Number(customerInfo.promotionStorageCapacity))
			return new Promise((resolve) => {
				const changeStorageCapacityAction = (amount: number) => {
					dialog.close()
					showBuyDialog({ featureType: BookingItemFeatureType.Storage, count: amount, freeAmount: freeStorageCapacity, reactivate: false })
						.then((confirm) => {
							if (confirm) {
								return buyStorage(amount)
							}
						})
						.then(() => {
							resolve()
						})
				}

				const cancelAction = () => {
					dialog.close()
					resolve()
				}

				const storageBuyOptionsAttrs = [
					createStorageCapacityBoxAttr(0, freeStorageCapacity, changeStorageCapacityAction),
					createStorageCapacityBoxAttr(10, freeStorageCapacity, changeStorageCapacityAction),
					createStorageCapacityBoxAttr(100, freeStorageCapacity, changeStorageCapacityAction),
					createStorageCapacityBoxAttr(1000, freeStorageCapacity, changeStorageCapacityAction),
				]
					.filter((scb) => scb.amount === 0 || scb.amount > freeStorageCapacity)
					.map((scb) => scb.buyOptionBoxAttr)
				// filter needless buy options
				const headerBarAttrs: DialogHeaderBarAttrs = {
					middle: () => lang.get("storageCapacity_label"),
					right: [
						{
							label: "close_alt",
							click: cancelAction,
							type: ButtonType.Primary,
						},
					],
				}
				const dialog = Dialog.largeDialog(headerBarAttrs, {
					view: () => [
						m(".pt-l.center.pb", storageWarningTextId ? m(".b", lang.get(storageWarningTextId)) : lang.get("buyStorageCapacityInfo_msg")),
						m(
							".flex-center.flex-wrap",
							storageBuyOptionsAttrs.map((attr) => m(BuyOptionBox, attr)),
						),
					],
				})
					.addShortcut({
						key: Keys.ESC,
						exec: cancelAction,
						help: "close_alt",
					})
					.setCloseHandler(cancelAction)
					.show()
			})
		})
}

function createStorageCapacityBoxAttr(
	amount: number,
	freeAmount: number,
	buyAction: (amount: number) => void,
): {
	amount: number
	buyOptionBoxAttr: BuyOptionBoxAttr
} {
	const attrs: BuyOptionBoxAttr = {
		heading: formatStorageCapacity(Math.max(amount, freeAmount)),
		actionButton: {
			view: () => {
				return m(Button, {
					label: "pricing.select_action",
					type: ButtonType.Login,
					click: () => buyAction(amount),
				})
			},
		},
		price: lang.get("emptyString_msg"),
		helpLabel: "emptyString_msg",
		features: [],
		width: 265,
		height: 250,
		paymentInterval: null,
		showReferenceDiscount: false,
	}
	updateBuyOptionBoxPriceInformation(locator.bookingFacade, BookingItemFeatureType.Storage, amount, attrs)
	return {
		amount,
		buyOptionBoxAttr: attrs,
	}
}

function formatStorageCapacity(amount: number): string {
	if (amount < 1000) {
		return amount + " GB"
	} else {
		return amount / 1000 + " TB"
	}
}
