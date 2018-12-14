// @flow
import m from "mithril"
import {inputLineHeight, px} from "../gui/size"
import {SegmentControl} from "./SegmentControl"
import {lang} from "../misc/LanguageViewModel"
import {PaymentIntervalItems} from "./SubscriptionUtils"
import {neverNull} from "../api/common/utils/Utils"


export type BuyOptionBoxAttr = {|
	heading: string,
	actionButton: ?Component,
	price: string,
	originalPrice: string,
	helpLabel: string | lazy<string>,
	features: () => string[],
	width: number,
	height: number,
	paymentInterval: ?Stream<number>,
	highlighted?: boolean,
	showReferenceDiscount: boolean,
|}

export function getActiveSubscriptionActionButtonReplacement() {
	return {
		view: () => {
			return m(".buyOptionBox.content-accent-fg.center-vertically.text-center", lang.get("pricing.currentPlan_label"))
		}
	}
}

class _BuyOptionBox {

	constructor() {
	}

	view(vnode: Vnode<BuyOptionBoxAttr>) {
		return m("", {
			style: {
				margin: "10px",
				width: px(vnode.attrs.width),
				padding: "10px"
			}
		}, [
			m(".buyOptionBox" + (vnode.attrs.highlighted ? ".highlighted" : ""), {
				style: {height: px(vnode.attrs.height)}
			}, [
				(vnode.attrs.showReferenceDiscount && vnode.attrs.price !== vnode.attrs.originalPrice)
					? m(".ribbon-vertical", m(".text-center.b.h4", {style: {'padding-top': px(22)}}, "%"))
					: null,
				m(".h4.text-center.dialog-header.dialog-header-line-height", vnode.attrs.heading),
				m(".text-center.pt.flex.center-vertically.center-horizontally", [
					m("span.h1", vnode.attrs.price),
					(vnode.attrs.showReferenceDiscount && vnode.attrs.price !== vnode.attrs.originalPrice)
						?
						m("span.strike.pl", "(" + vnode.attrs.originalPrice + ")")
						:
						null
				]),
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
				}, m(neverNull(vnode.attrs.actionButton))) : null
			]), m(".flex.col.pt", {
				style: {lineHeight: px(inputLineHeight)}
			}, vnode.attrs.features().map(f => m(".flex.center-horizontally.text-center.dialog-header.text-prewrap",
				// {style: {borderBottom: `1px solid ${theme.content_border}`}},
				[m(".align-self-center", f)])))
		])
	}
}

export const BuyOptionBox: Class<MComponent<BuyOptionBoxAttr>> = _BuyOptionBox









