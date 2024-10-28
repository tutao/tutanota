import m, { Child, Children, Component, Vnode, VnodeDOM } from "mithril"
import { px, size } from "../gui/size"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import { Icon } from "../gui/base/Icon"
import { SegmentControl } from "../gui/base/SegmentControl"
import { AvailablePlanType, Const, PlanType } from "../api/common/TutanotaConstants"
import { formatMonthlyPrice, PaymentInterval } from "./PriceUtils"
import Stream from "mithril/stream"
import { Icons } from "../gui/base/icons/Icons"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { InfoIcon } from "../gui/base/InfoIcon.js"
import { theme } from "../gui/theme.js"
import { isReferenceDateWithinCyberMondayCampaign } from "../misc/CyberMondayUtils.js"

export type BuyOptionBoxAttr = {
	heading: string | Children
	// lazy<ButtonAttrs> because you can't do actionButton instanceof ButtonAttrs since ButtonAttrs doesn't exist in the javascript side
	// there is a strange interaction between the HTMLEditor in HTML mode and the ButtonN when you pass the ButtonN in via a component
	// that doesn't occur when you pass in the attrs
	actionButton?: lazy<Children>
	price: string
	/**
	 * Null when we do not want to show the difference between actual price and reference price.
	 */
	referencePrice?: string
	priceHint?: TranslationKey | lazy<string>
	helpLabel: TranslationKey | lazy<string>
	width: number
	height: number
	/**
	 * can be null if the subscription is free, or it's not an initial upgrade box
	 */
	selectedPaymentInterval: Stream<PaymentInterval> | null
	accountPaymentInterval: PaymentInterval | null
	highlighted?: boolean
	mobile: boolean
	bonusMonths: number
	/**
	 * Nullable because of the gift card component compatibility
	 */
	targetSubscription?: AvailablePlanType
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
	iconStyle?: Record<string, any>
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
								f.heart
									? m(Icon, {
											icon: BootIcons.Heart,
											style: attrs.iconStyle,
									  })
									: m(Icon, { icon: f.antiFeature ? Icons.Cancel : Icons.Checkmark, style: attrs.iconStyle }),
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

		const isCyberMonday = isReferenceDateWithinCyberMondayCampaign(Const.CURRENT_DATE ?? new Date())
		const isLegendPlan = attrs.targetSubscription === PlanType.Legend
		const isYearly = (attrs.selectedPaymentInterval == null ? attrs.accountPaymentInterval : attrs.selectedPaymentInterval()) === PaymentInterval.Yearly

		const shouldApplyCyberMonday = isLegendPlan && isCyberMonday && isYearly

		const newReferencePrice: string | undefined = (() => {
			// Just display the cyber monday deal
			if (shouldApplyCyberMonday) {
				return formatMonthlyPrice(96, PaymentInterval.Yearly)
			}

			// Display the yearly price. If we are on yearly view, we want to know how much the user would save compared to monthly billing
			if (isYearly && !isCyberMonday) {
				return attrs.referencePrice
			}

			// Do not show the yearly reference price strikethrough in case we are in monthly billing
			return undefined
		})()

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
					".buyOptionBox" + (attrs.highlighted ? (shouldApplyCyberMonday ? ".highlighted.cyberMonday" : ".highlighted") : ""),
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
						shouldApplyCyberMonday ? this.renderCyberMondayRibbon() : this.renderBonusMonthsRibbon(attrs.bonusMonths),
						typeof attrs.heading === "string" ? this.renderHeading(attrs.heading) : attrs.heading,
						this.renderPrice(attrs.price, newReferencePrice),
						m(".small.text-center", attrs.priceHint ? lang.getMaybeLazy(attrs.priceHint) : lang.get("emptyString_msg")),
						m(".small.text-center.pb-ml", lang.getMaybeLazy(attrs.helpLabel)),
						this.renderPaymentIntervalControl(attrs.selectedPaymentInterval, shouldApplyCyberMonday),
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

	private renderPrice(price: string, strikethroughPrice?: string) {
		return m(
			".pt-ml.text-center",
			{ style: { display: "grid", "grid-template-columns": "1fr auto 1fr", "align-items": "center" } },
			strikethroughPrice != null
				? m(
						".span.strike",
						{
							style: {
								color: theme.content_button,
								fontSize: px(size.font_size_base),
								justifySelf: "end",
								margin: "auto 0.4em 0 0",
								padding: "0.4em 0",
							},
						},
						strikethroughPrice,
				  )
				: m(""),
			m(".h1", price),
			m(""),
		)
	}

	private renderBonusMonthsRibbon(bonusMonths: number): Children {
		return bonusMonths > 0 ? this.renderRibbon(`+${bonusMonths} ${lang.get("pricing.months_label")}`) : null
	}

	private renderRibbon(text: string) {
		return m(".ribbon-horizontal", m(".text-center.b", { style: { padding: px(3) } }, text))
	}

	private renderCyberMondayRibbon(): Children {
		return m(".ribbon-horizontal.ribbon-horizontal-cyber-monday", m(".text-center.b", { style: { padding: px(3) } }, lang.get("pricing.cyberMonday_label")))
	}

	private renderPaymentIntervalControl(paymentInterval: Stream<PaymentInterval> | null, shouldApplyCyberMonday: boolean): Children {
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
					shouldApplyCyberMonday,
			  })
			: null
	}

	private renderHeading(heading: string): Children {
		return m(
			// we need some margin for the discount banner for longer translations shown on the website
			`.h4.text-center.mb-small-line-height.flex.col.center-horizontally.mlr-l.dialog-header`,
			{
				style: {
					"font-size": heading.length > 20 ? "smaller" : undefined,
				},
			},
			heading,
		)
	}
}
