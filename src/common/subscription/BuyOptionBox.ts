import m, { Child, Children, Component, Vnode, VnodeDOM } from "mithril"
import { px, size } from "../gui/size"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import { Icon } from "../gui/base/Icon"
import { SegmentControl } from "../gui/base/SegmentControl"
import type { BookingItemFeatureType } from "../api/common/TutanotaConstants"
import { asPaymentInterval, formatMonthlyPrice, getCountFromPriceData, getPriceFromPriceData, PaymentInterval } from "./PriceUtils"
import type { BookingFacade } from "../api/worker/facades/lazy/BookingFacade.js"
import Stream from "mithril/stream"
import { Icons } from "../gui/base/icons/Icons"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { InfoIcon } from "../gui/base/InfoIcon.js"

export type BuyOptionBoxAttr = {
	heading: string | Children
	// lazy<ButtonAttrs> because you can't do actionButton instanceof ButtonAttrs since ButtonAttrs doesn't exist in the javascript side
	// there is a strange interaction between the HTMLEditor in HTML mode and the ButtonN when you pass the ButtonN in via a component
	// that doesn't occur when you pass in the attrs
	actionButton?: lazy<Children>
	price?: string
	priceHint?: TranslationKey | lazy<string>
	helpLabel: TranslationKey | lazy<string>
	width: number
	height: number
	/**
	 * can be null if the subscription is free or it's not an initial upgrade box
	 */
	paymentInterval: Stream<PaymentInterval> | null
	highlighted?: boolean
	showReferenceDiscount: boolean
	mobile: boolean
	bonusMonths: number
}

export type BuyOptionDetailsAttr = {
	categories: Array<{
		title: string | null
		key: string
		featureCount: { max: number }
		features: Array<{ text: string; toolTip?: Child; key: string; antiFeature?: boolean; omit: boolean; heart: boolean }>
	}>
	featuresExpanded?: boolean
	renderCategoryTitle: boolean
}

export function getActiveSubscriptionActionButtonReplacement(): () => Children {
	return () =>
		m(
			".buyOptionBox.content-accent-fg.center-vertically.text-center",
			{
				style: {
					"border-radius": px(size.border_radius_small),
				},
			},
			lang.get("pricing.currentPlan_label"),
		)
}

export const BOX_MARGIN = 10

export class BuyOptionDetails implements Component<BuyOptionDetailsAttr> {
	private featuresExpanded: boolean = false
	private featureListItemSelector: string = ".flex"

	onbeforeupdate(vnode: Vnode<BuyOptionDetailsAttr>, old: VnodeDOM<BuyOptionDetailsAttr>) {
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

	view(vnode: Vnode<BuyOptionDetailsAttr>) {
		const { attrs } = vnode
		this.featuresExpanded = attrs.featuresExpanded || false

		return m(
			".mt.pl",
			attrs.categories.map((fc) => {
				return [
					this.renderCategoryTitle(fc, attrs.renderCategoryTitle),
					fc.features
						.filter((f) => !f.omit || this.featuresExpanded)
						.map((f) =>
							m(this.featureListItemSelector, { key: f.key }, [
								f.heart ? m(Icon, { icon: BootIcons.Heart }) : m(Icon, { icon: f.antiFeature ? Icons.Cancel : Icons.Checkmark }),
								m(".small.text-left.align-self-center.pl-s.button-height.flex-grow.min-width-0.break-word", [m("span", f.text)]),
								f.toolTip
									? //@ts-ignore
									  m(InfoIcon, { text: f.toolTip })
									: null,
							]),
						),
					this.renderPlaceholders(fc),
				]
			}),
		)
	}

	private renderCategoryTitle(fc: BuyOptionDetailsAttr["categories"][0], renderCategoryTitle: boolean): Children {
		if (fc.title && this.featuresExpanded) {
			return [
				m(".b.text-left.align-self-center.pl-s.button-height.flex-grow.min-width-0.break-word", ""),
				m(".b.text-left.align-self-center.pl-s.button-height.flex-grow.min-width-0.break-word", renderCategoryTitle ? fc.title : ""),
			]
		} else {
			return []
		}
	}

	private renderPlaceholders(fc: BuyOptionDetailsAttr["categories"][0]): Children {
		if (!this.featuresExpanded) {
			return []
		} else {
			const placeholderCount = fc.featureCount.max - fc.features.length
			return [...Array(placeholderCount)].map(() => m(".button-height", ""))
		}
	}
}

export class BuyOptionBox implements Component<BuyOptionBoxAttr> {
	view(vnode: Vnode<BuyOptionBoxAttr>) {
		const { attrs } = vnode
		return m(
			".fg-black",
			{
				style: {
					width: px(attrs.width),
					padding: "10px",
					height: "100%",
				},
			},
			[
				m(
					".buyOptionBox" + (attrs.highlighted ? ".highlighted" : ""),
					{
						style: {
							display: "flex",
							"flex-direction": "column",
							"min-height": px(attrs.height),
							"border-radius": "3px",
							height: "100%",
						},
					},
					[
						this.renderRibbon(attrs.bonusMonths),
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
											"margin-top": "auto",
										},
									},
									attrs.actionButton(),
							  )
							: null,
					],
				),
			],
		)
	}

	private renderRibbon(bonusMonths: number): Children {
		return bonusMonths > 0
			? m(".ribbon-horizontal", m(".text-center.b", { style: { padding: px(3) } }, `+${bonusMonths} ${lang.get("pricing.months_label")}`))
			: null
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

	private renderHeading(heading: string): Children {
		return m(
			".h4.text-center.dialog-header.flex.col.center-horizontally",
			{
				style: {
					// we need some margin for the discount banner for longer translations shown on the website
					"margin-right": px(30),
					"margin-left": px(30),
					"margin-bottom": px(6),
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
