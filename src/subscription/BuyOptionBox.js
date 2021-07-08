// @flow
import m from "mithril"
import {px} from "../gui/size"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {neverNull} from "../api/common/utils/Utils"
import {Icons} from "../gui/base/icons/Icons"
import {Icon} from "../gui/base/Icon"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN} from "../gui/base/ButtonN"
import type {WorkerClient} from "../api/main/WorkerClient"
import type {BookingItemFeatureTypeEnum} from "../api/common/TutanotaConstants"
import {formatMonthlyPrice, getCountFromPriceData, getPriceFromPriceData, isYearlyPayment} from "./PriceUtils"

const PaymentIntervalItems: SegmentControlItem<number>[] = [
	{name: lang.get("pricing.yearly_label"), value: 12},
	{name: lang.get("pricing.monthly_label"), value: 1}
]

export type BuyOptionBoxAttr = {|
	heading: string | Children,
	// lazy<ButtonAttrs> because you can't do actionButton instanceof ButtonAttrs since ButtonAttrs doesn't exist in the javascript side
	// there is a strange interaction between the HTMLEditor in HTML mode and the ButtonN when you pass the ButtonN in via a component
	// that doesn't occur when you pass in the attrs
	actionButton: ?(MComponent<mixed> | lazy<ButtonAttrs>),
	price?: string,
	priceHint?: TranslationKey | lazy<string>,
	helpLabel: TranslationKey | lazy<string>,
	features: () => string[],
	width: number,
	height: number,
	paymentInterval: ?Stream<number>,
	highlighted?: boolean,
	showReferenceDiscount: boolean,
|}

export function getActiveSubscriptionActionButtonReplacement(): {|view: () => Vnode<Children>|} {
	return {
		view: () => {
			return m(".buyOptionBox.content-accent-fg.center-vertically.text-center", {
				style: {
					'border-radius': '3px'
				}
			}, lang.get("pricing.currentPlan_label"))
		}
	}
}

export const BOX_MARGIN = 10

export class BuyOptionBox implements MComponent<BuyOptionBoxAttr> {

	view(vnode: Vnode<BuyOptionBoxAttr>): Children {

		return m("", {
			style: {
				margin: px(BOX_MARGIN),
				width: px(vnode.attrs.width),
				padding: "10px"
			}
		}, [
			m(".buyOptionBox" + (vnode.attrs.highlighted ? ".highlighted" : ""), {
				style: {
					height: px(vnode.attrs.height),
					'border-radius': '3px'
				}
			}, [
				(vnode.attrs.paymentInterval ? isYearlyPayment(vnode.attrs.paymentInterval()) : null)
					? m(".ribbon-vertical", m(".text-center.b.h4", {style: {'padding-top': px(22)}}, "%"))
					: null,
				m(".h4.text-center.dialog-header.dialog-header-line-height.flex.col.center-horizontally", {
					style: {
						// we need some margin for the discount banner for longer translations shown on the website
						"margin-right": px(30),
						"margin-left": px(30),
						"line-height": 1,
					}
				}, vnode.attrs.heading),
				m(".text-center.pt.flex.center-vertically.center-horizontally", [
					vnode.attrs.price ? m("span.h1", vnode.attrs.price) : null,
				]),
				m(".small.text-center", vnode.attrs.priceHint ? lang.getMaybeLazy(vnode.attrs.priceHint) : lang.get("emptyString_msg")),
				m(".small.text-center.pb-s", lang.getMaybeLazy(vnode.attrs.helpLabel)),
				(vnode.attrs.paymentInterval) ? m(SegmentControl, {
					selectedValue: vnode.attrs.paymentInterval,
					items: PaymentIntervalItems
				}) : null,
				vnode.attrs.actionButton ? m(".button-min-height", {
						style: {
							position: "absolute",
							bottom: px(10),
							left: px(10),
							right: px(10)
						}
					}, (typeof vnode.attrs.actionButton === "function"
					? m(ButtonN, vnode.attrs.actionButton())
					: m(neverNull(vnode.attrs.actionButton))))
					: null
			]), m("div.mt.pl", vnode.attrs.features().map(f => m(".flex",
				[
					m(Icon, {
						icon: Icons.Checkmark,
						style: {
							'padding-top': '1px'
						}
					}),
					m(".smaller.left.align-self-center.pl-xs", {
						style: {
							height: px(40),
							lineHeight: px(18)
						}
					}, f)
				]
			)))
		])
	}
}

/**
 * Loads the price information for the given feature type/amount and updates the price information on the BuyOptionBox.
 */
export async function updateBuyOptionBoxPriceInformation(worker: WorkerClient, featureType: BookingItemFeatureTypeEnum, amount: number, attrs: BuyOptionBoxAttr): Promise<void> {
	const newPrice = await worker.getPrice(featureType, amount, false)
	if (amount === getCountFromPriceData(newPrice.currentPriceNextPeriod, featureType)) {
		attrs.actionButton = getActiveSubscriptionActionButtonReplacement()
	}
	const futurePrice = newPrice.futurePriceNextPeriod
	if (futurePrice) {
		const paymentInterval = Number(futurePrice.paymentInterval)
		const price = getPriceFromPriceData(futurePrice, featureType)
		attrs.price = formatMonthlyPrice(price, paymentInterval)
		attrs.helpLabel = isYearlyPayment(paymentInterval) ? "pricing.perMonthPaidYearly_label" : "pricing.perMonth_label"
		m.redraw()
	}
}