import { AccountingInfoTypeRef, PriceData, PriceItemData, PriceServiceReturn } from "@tutao/entities/sys"
import { BookingItemFeatureType } from "../../../entities/sys/Utils"
import m, { Children, Component, Vnode } from "mithril"
import { assertNotNull, filterInt, incrementDate, newPromise, ofClass } from "@tutao/utils"
import { LegacyTextField, LegacyTextFieldType } from "../../../ui/base/LegacyTextField.js"
import { Dialog, DialogType } from "../../../ui/base/Dialog.js"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { assertMainOrNode, FeatureType } from "@tutao/app-env"
import { formatDate } from "../../../ui/utils/Formatter.js"
import * as restError from "@tutao/rest-client/error"
import { asPaymentInterval, formatPrice, getPriceItem, PaymentInterval } from "./utils/PriceUtils.js"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog.js"
import { locator } from "../api/main/CommonLocator.js"
import { NotAuthorizedError } from "@tutao/rest-client/error"
import { PriceChangeModel } from "./PriceChangeModel"
import { idToElementId } from "@tutao/meta"

assertMainOrNode()

export interface BookingParams {
	featureType: BookingItemFeatureType
	bookingText: TranslationKey
	count: number
	freeAmount: number
	reactivate: boolean
}

/**
 * Returns true if the order is accepted by the user, false otherwise.
 */
export async function showBuyDialog(params: BookingParams): Promise<boolean> {
	if (locator.logins.isEnabled(FeatureType.HideBuyDialogs)) {
		return true
	}
	const priceChangeModel = await showProgressDialog("pleaseWait_msg", prepareDialog(params))
	if (priceChangeModel) {
		return showDialog(priceChangeModel.getActionLabel(), () =>
			m(ConfirmSubscriptionView, {
				priceChangeModel,
				count: params.count,
				freeAmount: params.freeAmount,
				bookingText: params.bookingText,
			}),
		)
	} else {
		return false
	}
}

async function prepareDialog({ featureType, count, reactivate }: BookingParams): Promise<PriceChangeModel | null> {
	const price = await locator.bookingFacade.getPrice(featureType, count, reactivate)
	const priceChangeModel = new PriceChangeModel(price, featureType)
	const customerInfo = await locator.logins.getUserController().loadCustomerInfo()
	const accountingInfo = await locator.entityClient
		.load(AccountingInfoTypeRef, idToElementId(customerInfo.accountingInfo))
		.catch(ofClass(NotAuthorizedError, () => null))
	if (accountingInfo && accountingInfo.paymentMethod == null) {
		const confirm = await Dialog.confirm("enterPaymentDataFirst_msg")
		if (confirm) {
			m.route.set("/settings/invoice")
		}

		return null
	} else {
		return priceChangeModel
	}
}

function showDialog(okLabel: TranslationKey, view: () => Children) {
	return newPromise<boolean>((resolve) => {
		let dialog: Dialog

		const doAction = (res: boolean) => {
			dialog.close()
			resolve(res)
		}

		dialog = Dialog.showActionDialog({
			okActionTextId: okLabel,
			title: "bookingSummary_label",
			child: () => view(),
			okAction: () => doAction(true),
			cancelAction: () => doAction(false),
			type: DialogType.EditSmall,
		})
	})
}

interface ConfirmAttrs {
	priceChangeModel: PriceChangeModel
	count: number
	freeAmount: number
	bookingText: TranslationKey
}

class ConfirmSubscriptionView implements Component<ConfirmAttrs> {
	view({ attrs }: Vnode<ConfirmAttrs>): Children {
		const { priceChangeModel, count, freeAmount } = attrs
		const chargeDate = incrementDate(priceChangeModel.periodEndDate(), 1)

		return m("", [
			m(LegacyTextField, {
				label: "bookingOrder_label",
				value: lang.get(attrs.bookingText, {
					"{1}": Math.abs(count),
				}),
				type: LegacyTextFieldType.Area,
				isReadOnly: true,
			}),
			priceChangeModel.isBuy()
				? m(LegacyTextField, {
						label: "subscription_label",
						helpLabel: () => lang.get("nextChargeOn_label", { "{chargeDate}": formatDate(chargeDate) }),
						value: this.getSubscriptionText(priceChangeModel),
						isReadOnly: true,
					})
				: null,
			m(LegacyTextField, {
				label: "price_label",
				helpLabel: () => this.getPriceInfoText(priceChangeModel),
				value: this.getPriceText(priceChangeModel, !priceChangeModel.isUnbuy()),
				isReadOnly: true,
			}),
			// this can be the case when there are active discounts that will disappear at the end of the period.
			priceChangeModel.priceDeltaThisPeriod !== priceChangeModel.priceDeltaNextPeriod && !priceChangeModel.isUnbuy()
				? m(LegacyTextField, {
						label: "priceForNextYear_label",
						value: this.getPriceText(priceChangeModel, false),
						isReadOnly: true,
					})
				: null,
		])
	}

	private getSubscriptionText(model: PriceChangeModel): string {
		if (model.isYearly()) {
			return lang.get("pricing.yearly_label")
		} else {
			return lang.get("pricing.monthly_label")
		}
	}

	private getPriceText(model: PriceChangeModel, thisPeriod: boolean): string {
		let netGrossText = model.taxIncluded() ? lang.get("gross_label") : lang.get("net_label")
		let periodText = model.isYearly() ? lang.get("pricing.perYear_label") : lang.get("pricing.perMonth_label")

		if (model.isSinglePriceType()) {
			const delta = thisPeriod ? model.priceDeltaThisPeriod : model.priceDeltaNextPeriod
			return `${formatPrice(delta, true)} ${periodText} (${netGrossText})`
		} else {
			return `${formatPrice(model.futureTotalPriceThisPeriod, true)} ${periodText} (${netGrossText})`
		}
	}

	private getPriceInfoText(model: PriceChangeModel): string {
		if (model.isUnbuy()) {
			return lang.get("priceChangeValidFrom_label", {
				"{1}": formatDate(model.periodEndDate()),
			})
		} else if (model.currentPeriodProratedPrice != null && model.currentPeriodProratedPrice !== model.priceDeltaThisPeriod) {
			return lang.get("priceForCurrentAccountingPeriod_label", {
				"{1}": formatPrice(model.currentPeriodProratedPrice, true),
			})
		} else {
			return ""
		}
	}
}
