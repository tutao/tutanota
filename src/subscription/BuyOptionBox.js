// @flow
import m from "mithril"
import {px} from "../gui/size"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {PaymentIntervalItems} from "./SubscriptionUtils"
import {neverNull} from "../api/common/utils/Utils"
import {Icons} from "../gui/base/icons/Icons"
import {Icon} from "../gui/base/Icon"
import {SegmentControl} from "../gui/base/SegmentControl"


export type BuyOptionBoxAttr = {|
	heading: string,
	actionButton: ?Component,
	price: string,
	originalPrice: string,
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

class _BuyOptionBox {

	constructor() {

	}

	view(vnode: Vnode<BuyOptionBoxAttr>) {

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
				(vnode.attrs.showReferenceDiscount && vnode.attrs.price !== vnode.attrs.originalPrice)
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
					m("span.h1", vnode.attrs.price),
					(vnode.attrs.showReferenceDiscount && vnode.attrs.price !== vnode.attrs.originalPrice)
						? [
							// This element is for the screen reader because they tend to not announce strikethrough.
							m("span", {
								style: {
									opacity: "0",
									width: "0",
									height: "0",
								},
								// TODO: translate
							}, "Original price: "),
							m("s.pl", "(" + vnode.attrs.originalPrice + ")"),
						]
						: null
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

export const BuyOptionBox: Class<MComponent<BuyOptionBoxAttr>> = _BuyOptionBox









