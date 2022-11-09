import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {BuyOptionBoxAttr} from "./BuyOptionBox"
import {BOX_MARGIN, BuyOptionBox, getActiveSubscriptionActionButtonReplacement} from "./BuyOptionBox"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import {formatMonthlyPrice, getSubscriptionPrice, isYearlyPayment} from "./PriceUtils"
import {
	FeatureListItem, featureLoadingDone,
	getDisplayNameOfSubscriptionType,
	getFormattedSubscriptionPrice,
	getSubscriptionConfig,
	getSubscriptionFeatures,
	ReplacementKey,
	SelectedSubscriptionOptions,
	SubscriptionPlanPrices,
	SubscriptionType,
	UpgradePriceType
} from "./SubscriptionDataProvider"
import {ProgrammingError} from "../api/common/error/ProgrammingError"

const BusinessUseItems: SegmentControlItem<boolean>[] = [
	{
		name: lang.get("pricing.privateUse_label"),
		value: false,
	},
	{
		name: lang.get("pricing.businessUse_label"),
		value: true,
	},
]

export type SubscriptionActionButtons = {
	Free: Component
	Premium: Component
	PremiumBusiness: Component
	Teams: Component
	TeamsBusiness: Component
	Pro: Component
}

export type SubscriptionSelectorAttr = {
	options: SelectedSubscriptionOptions
	campaignInfoTextId: TranslationKey | null
	actionButtons: SubscriptionActionButtons
	boxWidth: number
	boxHeight: number
	highlightPremium?: boolean
	currentSubscriptionType: SubscriptionType | null
	currentlySharingOrdered: boolean
	currentlyBusinessOrdered: boolean
	currentlyWhitelabelOrdered: boolean
	orderedContactForms: number
	isInitialUpgrade: boolean
	planPrices: SubscriptionPlanPrices
}

export function getActionButtonBySubscription(actionButtons: SubscriptionActionButtons, subscription: SubscriptionType): Component {
	const ret = actionButtons[subscription]
	if (ret == null) {
		throw new ProgrammingError("Plan is not valid")
	}
	return ret
}

type ExpanderTargets = SubscriptionType | "All"

export class SubscriptionSelector implements Component<SubscriptionSelectorAttr> {
	private containerDOM: Element | null = null
	private featuresExpanded: { [K in ExpanderTargets]: boolean } = {
		Free: false,
		Premium: false,
		PremiumBusiness: false,
		Teams: false,
		TeamsBusiness: false,
		Pro: false,
		All: false
	}

	view(vnode: Vnode<SubscriptionSelectorAttr>): Children {
		let buyBoxesViewPlacement
		// Add BuyOptionBox margin twice to the boxWidth received
		const columnWidth = vnode.attrs.boxWidth + BOX_MARGIN * 2
		const inMobileView: boolean | null = this.containerDOM && this.containerDOM.clientWidth < columnWidth * 2
		const featureExpander = this.renderFeatureExpanders(inMobileView) // renders all feature expanders, both for every single subscription option but also for the whole list
		let additionalInfo: Children

		if (vnode.attrs.options.businessUse()) {
			buyBoxesViewPlacement = [
				m("", [m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.PremiumBusiness)), featureExpander.PremiumBusiness]),
				m("", [m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.TeamsBusiness)), featureExpander.TeamsBusiness]),
				m("", [m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Pro)), featureExpander.Pro]),
			]
			additionalInfo = m(".flex.flex-column.items-center", [
				featureExpander.All, // global feature expander
				m(".smaller.mb.center", lang.get("downgradeToPrivateNotAllowed_msg")), //only displayed when business options are shown)
				m(".smaller.mb.center", lang.get("subscriptionPeriodInfoBusiness_msg"))
			])
		} else {
			const currentSubscription = vnode.attrs.currentSubscriptionType
			const premiumBuyOptionBox = m("",
				currentSubscription === SubscriptionType.PremiumBusiness
					? [m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.PremiumBusiness)), featureExpander.PremiumBusiness]
					: [m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Premium)), featureExpander.Premium])
			const teamsBuyOptionBox = m("",
				currentSubscription === SubscriptionType.TeamsBusiness
					? [m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.TeamsBusiness)), featureExpander.TeamsBusiness]
					: [m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Teams)), featureExpander.Teams])

			const freeBuyOptionBox = m("", [m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Free)), featureExpander.Free])

			// Changes order of BuyBoxes to Premium Pro Free, needed for mobile view (one column layout)
			if (inMobileView) {
				buyBoxesViewPlacement = [premiumBuyOptionBox, teamsBuyOptionBox, freeBuyOptionBox]
			} else {
				buyBoxesViewPlacement = [freeBuyOptionBox, premiumBuyOptionBox, teamsBuyOptionBox]
			}
			additionalInfo = m(".flex.flex-column.items-center", [
				featureExpander.All, // global feature expander
				m(".smaller.mb.center", lang.get("subscriptionPeriodInfoPrivate_msg"))
			])
		}

		const currentPlanInfo = this.getCurrentPlanInfo(vnode.attrs)

		return [
			vnode.attrs.isInitialUpgrade
				? m(SegmentControl, {
					selectedValue: vnode.attrs.options.businessUse(),
					onValueSelected: vnode.attrs.options.businessUse,
					items: BusinessUseItems,
				})
				: null,
			vnode.attrs.campaignInfoTextId && lang.exists(vnode.attrs.campaignInfoTextId) ? m(".b.center.mt", lang.get(vnode.attrs.campaignInfoTextId)) : null,
			currentPlanInfo ? m(".smaller.center.mt", currentPlanInfo) : null,
			m(".flex.center-horizontally.wrap", {
					oncreate: vnode => {
						this.containerDOM = vnode.dom as HTMLElement
						m.redraw()
					},
				},
				buyBoxesViewPlacement,
				additionalInfo
			),
		]
	}

	private getCurrentPlanInfo(selectorAttrs: SubscriptionSelectorAttr): string | null {
		if (selectorAttrs.options.businessUse() && selectorAttrs.currentSubscriptionType && !selectorAttrs.currentlyBusinessOrdered) {
			const price = getSubscriptionPrice(selectorAttrs.options.paymentInterval(), selectorAttrs.currentSubscriptionType, UpgradePriceType.PlanActualPrice)
			return (
				lang.get("businessCustomerNeedsBusinessFeaturePlan_msg", {
					"{price}": formatMonthlyPrice(price, selectorAttrs.options.paymentInterval()),
					"{plan}": selectorAttrs.currentSubscriptionType,
				}) +
				" " +
				lang.get("businessCustomerAutoBusinessFeature_msg")
			)
		}

		return null
	}

	private createBuyOptionBoxAttr(selectorAttrs: SubscriptionSelectorAttr, targetSubscription: SubscriptionType): BuyOptionBoxAttr {
		const subscriptionFeatures = getSubscriptionFeatures(targetSubscription)
		const featuresToShow = subscriptionFeatures.features
												   .filter(f => this.featuresExpanded[targetSubscription] || this.featuresExpanded.All || !f.omit)
												   .map(f => localizeFeatureListItem(f, targetSubscription, selectorAttrs.options.paymentInterval()))

		// we only highlight the private Premium box if this is a signup or the current subscription type is Free
		selectorAttrs.highlightPremium =
			targetSubscription === SubscriptionType.Premium &&
			!selectorAttrs.options.businessUse() &&
			(!selectorAttrs.currentSubscriptionType || selectorAttrs.currentSubscriptionType === SubscriptionType.Free)
		return {
			heading: getDisplayNameOfSubscriptionType(targetSubscription),
			actionButton:
				selectorAttrs.currentSubscriptionType === targetSubscription
					? getActiveSubscriptionActionButtonReplacement()
					: getActionButtonBySubscription(selectorAttrs.actionButtons, targetSubscription),
			price: getFormattedSubscriptionPrice(
				selectorAttrs.options.paymentInterval(),
				targetSubscription,
				UpgradePriceType.PlanReferencePrice
			),
			priceHint: getPriceHint(getSubscriptionPrice(selectorAttrs.options.paymentInterval(), targetSubscription, UpgradePriceType.PlanActualPrice), selectorAttrs.options.paymentInterval()),
			helpLabel: getHelpLabel(targetSubscription, selectorAttrs.options.businessUse()),
			features: featuresToShow,
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: selectorAttrs.isInitialUpgrade && targetSubscription !== SubscriptionType.Free ? selectorAttrs.options.paymentInterval : null,
			highlighted: selectorAttrs.highlightPremium,
			showReferenceDiscount: selectorAttrs.isInitialUpgrade,
		}
	}

	/**
	 * Renders the feature expanders depending on whether currently displaying the feature list in single-column layout or in multi-column layout.
	 * If a specific expander is not needed and thus should not be renderer, null | undefined is returned
	 * @param inMobileView
	 * @private
	 */
	private renderFeatureExpanders(inMobileView: boolean | null): Record<ExpanderTargets, Children> {
		if (featureLoadingDone()) { // were not able to download the feature list
			return Object.assign({} as Record<ExpanderTargets, Children>)
		}
		if (inMobileView) { // In single-column layout every subscription type has its own feature expander.
			if (this.featuresExpanded.All) {
				for(const k in this.featuresExpanded) {
					this.featuresExpanded[k as ExpanderTargets] = true
				}
			}
			return {
				Free: this.renderExpander(SubscriptionType.Free),
				Pro: this.renderExpander(SubscriptionType.Pro),
				Teams: this.renderExpander(SubscriptionType.Teams),
				Premium: this.renderExpander(SubscriptionType.Premium),
				TeamsBusiness: this.renderExpander(SubscriptionType.TeamsBusiness),
				PremiumBusiness: this.renderExpander(SubscriptionType.PremiumBusiness),
				All: null
			}
		} else {
			for(const k in this.featuresExpanded) {
				this.featuresExpanded[k as ExpanderTargets] = this.featuresExpanded.All // in multi-column layout the specific feature expanders should follow the global one
			}
			return Object.assign({} as Record<ExpanderTargets, Children>, {All: this.renderExpander("All")})
		}
	}

	/**
	 * Renders a single feature expander.
	 * @param subType The current expander that should be rendered
	 * @private
	 */
	private renderExpander(subType: ExpanderTargets): Children {
		return this.featuresExpanded[subType]
			? null :
			m(".mb-l.content-hover.button.cursor-pointer.text-fade.center", {
				role: "button",
				onclick: (e: Event) => {
					this.featuresExpanded[subType] = !this.featuresExpanded[subType]
					e.preventDefault()
				}
			}, lang.get("pricing.showAllFeatures"))
	}
}

function localizeFeatureListItem(
	item: FeatureListItem,
	targetSubscription: SubscriptionType,
	paymentInterval: number
): BuyOptionBoxAttr['features'][0] {
	const text = lang.get(item.text, getReplacement(item.replacements, targetSubscription, paymentInterval))
	if (!item.toolTip) {
		return {text, key: item.text, antiFeature: item.antiFeature}
	} else {
		const toolTipText = lang.get(item.toolTip)
		const toolTip = item.toolTip.endsWith("_markdown")
			? m.trust(toolTipText)
			: toolTipText
		return {text, toolTip, key: item.text, antiFeature: item.antiFeature}
	}
}

/**
 * get a string to insert into a translation with a slot.
 * if no key is found, undefined is returned and nothing is replaced.
 */
export function getReplacement(key: ReplacementKey | undefined, subscription: SubscriptionType, paymentInterval: number) {
	switch (key) {
		case "pricePerExtraUser":
			return {"{1}": getFormattedSubscriptionPrice(paymentInterval, subscription, UpgradePriceType.AdditionalUserPrice)}
		case "mailAddressAliases":
			return {"{amount}": getSubscriptionConfig(subscription).nbrOfAliases}
		case "storage":
			return {"{amount}": getSubscriptionConfig(subscription).storageGb}
		case "contactForm":
			return {"{price}": getFormattedSubscriptionPrice(paymentInterval, subscription, UpgradePriceType.ContactFormPrice)}
	}
}

function getHelpLabel(subscriptionType: SubscriptionType, businessUse: boolean): TranslationKey {
	if (subscriptionType === SubscriptionType.Free) return 'pricing.upgradeLater_msg'
	return businessUse
		? 'pricing.basePriceExcludesTaxes_msg'
		: 'pricing.basePriceIncludesTaxes_msg'
}

function getPriceHint(subscriptionPrice: number, paymentInterval: number): TranslationKey {
	if (subscriptionPrice > 0) {
		return isYearlyPayment(paymentInterval) ? "pricing.perMonthPaidYearly_label" : "pricing.perMonth_label"
	} else {
		return "emptyString_msg"
	}
}