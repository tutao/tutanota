import m, { Child, Children, Component, Vnode, VnodeDOM } from "mithril"
import { px, size } from "../gui/size"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import { Icon } from "../gui/base/Icon"
import { SegmentControl } from "../gui/base/SegmentControl"
import type { ButtonAttrs } from "../gui/base/Button.js"
import { Button } from "../gui/base/Button.js"
import type { BookingItemFeatureType } from "../api/common/TutanotaConstants"
import { asPaymentInterval, formatMonthlyPrice, getCountFromPriceData, getPriceFromPriceData, PaymentInterval } from "./PriceUtils"
import type { BookingFacade } from "../api/worker/facades/BookingFacade"
import Stream from "mithril/stream"
import { Icons } from "../gui/base/icons/Icons"

export type BuyOptionBoxAttr = {
	heading: string | Children
	// lazy<ButtonAttrs> because you can't do actionButton instanceof ButtonAttrs since ButtonAttrs doesn't exist in the javascript side
	// there is a strange interaction between the HTMLEditor in HTML mode and the ButtonN when you pass the ButtonN in via a component
	// that doesn't occur when you pass in the attrs
	actionButton?: Component | lazy<ButtonAttrs>
	price?: string
	priceHint?: TranslationKey | lazy<string>
	helpLabel: TranslationKey | lazy<string>
	features: Array<{ text: string; toolTip?: Child; key: string; antiFeature?: boolean }>
	featuresExpanded?: boolean
	width: number
	height: number
	/**
	 * can be null if the subscription is free or it's not an initial upgrade box
	 */
	paymentInterval: Stream<PaymentInterval> | null
	highlighted?: boolean
	showReferenceDiscount: boolean
}

export function getActiveSubscriptionActionButtonReplacement(): {
	view: () => Vnode<Children>
} {
	return {
		view: () => {
			return m(
				".buyOptionBox.content-accent-fg.center-vertically.text-center",
				{
					style: {
						"border-radius": px(size.border_radius_small),
					},
				},
				lang.get("pricing.currentPlan_label"),
			)
		},
	}
}

export const BOX_MARGIN = 10

export class BuyOptionBox implements Component<BuyOptionBoxAttr> {
	private featureListItemSelector: string = ".flex"
	private featuresExpanded: boolean = false

	view(vnode: Vnode<BuyOptionBoxAttr>) {
		const { attrs } = vnode
		this.featuresExpanded = attrs.featuresExpanded || false
		return m(
			".fg-black",
			{
				style: {
					margin: px(BOX_MARGIN),
					width: px(attrs.width),
					padding: "10px",
				},
			},
			[
				m(
					".buyOptionBox" + (attrs.highlighted ? ".highlighted" : ""),
					{
						style: {
							height: px(attrs.height),
							"border-radius": "3px",
						},
					},
					[
						this.renderRibbon(attrs.paymentInterval?.()),
						typeof attrs.heading === "string" ? this.renderHeading(attrs.heading) : attrs.heading,
						m(".text-center.pt.flex.center-vertically.center-horizontally", m("span.h1", attrs.price)),
						m(".small.text-center", attrs.priceHint ? lang.getMaybeLazy(attrs.priceHint) : lang.get("emptyString_msg")),
						m(".small.text-center.pb-s", lang.getMaybeLazy(attrs.helpLabel)),
						this.renderPaymentIntervalControl(attrs.paymentInterval),
						attrs.actionButton
							? m(
									".button-min-height",
									{
										style: {
											position: "absolute",
											bottom: px(10),
											left: px(10),
											right: px(10),
										},
									},
									attrs.actionButton
										? typeof attrs.actionButton === "function"
											? m(Button, attrs.actionButton())
											: m(attrs.actionButton)
										: null,
							  )
							: null,
					],
				),
				this.renderFeatureList(attrs.features),
			],
		)
	}

	onbeforeupdate(vnode: Vnode<BuyOptionBoxAttr>, old: VnodeDOM<BuyOptionBoxAttr>) {
		// the expand css class renders an animation which is used when the feature list is expanded
		// the animation should only be shown when the user clicked on the feature expansion button which changes the expanded state
		// thus to check whether the button was pressed, the BuyOptionBox before update must not be expanded but the BuyOptionBox after update is
		// otherwise mithril sometimes updates the view and renders the animation even though nothing changed
		if (vnode.attrs.featuresExpanded && !old.attrs.featuresExpanded) {
			this.featureListItemSelector = ".flex.expand"
		} else {
			this.featureListItemSelector = ".flex"
		}
	}

	private renderRibbon(paymentInterval?: PaymentInterval): Children {
		return paymentInterval === PaymentInterval.Yearly ? m(".ribbon-vertical", m(".text-center.b.h4", { style: { "padding-top": px(22) } }, "%")) : null
	}

	private renderPaymentIntervalControl(paymentInterval: Stream<PaymentInterval> | null): Children {
		const paymentIntervalItems = [
			{ name: lang.get("pricing.yearly_label"), value: PaymentInterval.Yearly },
			{ name: lang.get("pricing.monthly_label"), value: PaymentInterval.Monthly },
		]
		return paymentInterval
			? m(SegmentControl, {
					selectedValue: paymentInterval(),
					items: paymentIntervalItems,
					onValueSelected: (v: PaymentInterval) => {
						paymentInterval?.(v)
						m.redraw()
					},
			  })
			: null
	}

	private renderFeatureList(features: BuyOptionBoxAttr["features"]): Children {
		return m(
			".mt.pl",
			features.map((f) =>
				m(this.featureListItemSelector, { key: f.key }, [
					m(Icon, { icon: f.antiFeature ? Icons.Cancel : Icons.Checkmark }),
					m(".small.text-left.align-self-center.pl-s.button-height.flex-grow.min-width-0.break-word", f.text),
					f.toolTip
						? //@ts-ignore
						  m(InfoIcon, { text: f.toolTip })
						: null,
				]),
			),
		)
	}

	private renderHeading(heading: string): Children {
		return m(
			".h4.text-center.dialog-header.flex.col.center-horizontally",
			{
				style: {
					// we need some margin for the discount banner for longer translations shown on the website
					"margin-right": px(30),
					"margin-left": px(30),
					"line-height": 1,
				},
			},
			m(
				"div",
				{
					style: {
						"font-size": heading.length > 20 ? "smaller" : undefined,
					},
				},
				heading,
			),
		)
	}
}

/**
 * Loads the price information for the given feature type/amount and updates the price information on the BuyOptionBox.
 */
export async function updateBuyOptionBoxPriceInformation(
	bookingFacade: BookingFacade,
	featureType: BookingItemFeatureType,
	amount: number,
	attrs: BuyOptionBoxAttr,
): Promise<void> {
	const newPrice = await bookingFacade.getPrice(featureType, amount, false)

	if (amount === getCountFromPriceData(newPrice.currentPriceNextPeriod, featureType)) {
		attrs.actionButton = getActiveSubscriptionActionButtonReplacement()
	}

	const futurePrice = newPrice.futurePriceNextPeriod

	if (futurePrice) {
		const paymentInterval = asPaymentInterval(futurePrice.paymentInterval)
		const price = getPriceFromPriceData(futurePrice, featureType)
		attrs.price = formatMonthlyPrice(price, paymentInterval)
		attrs.helpLabel = paymentInterval === PaymentInterval.Yearly ? "pricing.perMonthPaidYearly_label" : "pricing.perMonth_label"
		m.redraw()
	}
}

export interface InfoIconAttrs {
	text: Children
}

export class InfoIcon implements Component<InfoIconAttrs> {
	expanded: boolean = false

	view({ attrs }: Vnode<InfoIconAttrs>) {
		return m(
			".flex.items-center.justify-center.no-grow-no-shrink.overflow-visible",
			{
				"aria-pressed": String(this.expanded),
				role: "button",
				style: {
					width: "24px",
					height: "24px",
				},
				// we can't really do the state with pure CSS on mobile
				onclick: () => {
					this.expanded = true
					document.addEventListener("click", this.listener, { capture: true })
				},
				onkeydown: (e: KeyboardEvent) => {
					if (e.key === "Escape") {
						this.listener(e)
					}
				},
			},
			m(
				".info-badge.tooltip",
				{
					expanded: String(this.expanded),
					tabindex: 0,
				},
				"i",
				m(
					"span.tooltiptext.break-word",
					{
						style: {
							width: px(120),
							marginLeft: px(-120),
						},
					},
					attrs.text,
				),
			),
		)
	}

	private readonly listener = (e: Event) => {
		this.expanded = false
		document.removeEventListener("click", this.listener, { capture: true })
		e.stopPropagation()
		m.redraw()
	}
}
