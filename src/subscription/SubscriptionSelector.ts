import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey, TranslationText } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { BuyOptionBoxAttr } from "./BuyOptionBox"
import { BOX_MARGIN, BuyOptionBox, getActiveSubscriptionActionButtonReplacement } from "./BuyOptionBox"
import type { SegmentControlItem } from "../gui/base/SegmentControl"
import { SegmentControl } from "../gui/base/SegmentControl"
import { formatMonthlyPrice, PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import {
	FeatureCategory,
	FeatureListItem,
	FeatureListProvider,
	getDisplayNameOfPlanType,
	ReplacementKey,
	SelectedSubscriptionOptions,
	UpgradePriceType,
} from "./FeatureListProvider"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import { ButtonAttrs } from "../gui/base/Button.js"
import { downcast, lazy } from "@tutao/tutanota-utils"
import { AvailablePlanType, LegacyPlans, NewBusinessPlans, NewPersonalPlans, PlanType } from "../api/common/TutanotaConstants.js"

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

export type SubscriptionActionButtons = Record<AvailablePlanType, lazy<ButtonAttrs>>

export type SubscriptionSelectorAttr = {
	options: SelectedSubscriptionOptions
	priceInfoTextId: TranslationKey | null
	actionButtons: SubscriptionActionButtons
	boxWidth: number
	boxHeight: number
	highlightPremium?: boolean
	currentPlanType: PlanType | null
	allowSwitchingPaymentInterval: boolean
	featureListProvider: FeatureListProvider
	priceAndConfigProvider: PriceAndConfigProvider
	acceptedPlans: AvailablePlanType[]
	multipleUsersAllowed: boolean
	msg: TranslationText | null
}

export function getActionButtonBySubscription(actionButtons: SubscriptionActionButtons, subscription: AvailablePlanType): lazy<ButtonAttrs> {
	const ret = actionButtons[subscription]
	if (ret == null) {
		throw new ProgrammingError("Plan is not valid")
	}
	return ret
}

type ExpanderTargets = AvailablePlanType | "All"

export class SubscriptionSelector implements Component<SubscriptionSelectorAttr> {
	private containerDOM: Element | null = null
	private featuresExpanded: { [K in ExpanderTargets]: boolean } = {
		[PlanType.Free]: false,
		[PlanType.Revolutionary]: false,
		[PlanType.Legend]: false,
		[PlanType.Essential]: false,
		[PlanType.Advanced]: false,
		[PlanType.Unlimited]: false,
		All: false,
	}

	oninit(vnode: Vnode<SubscriptionSelectorAttr>): any {
		const acceptedPlans = vnode.attrs.acceptedPlans
		const onlyBusinessPlansAccepted = acceptedPlans.every((plan) => NewBusinessPlans.includes(plan))

		if (onlyBusinessPlansAccepted) {
			// if only business plans are accepted, we show them first even if the current plan is a personal plan
			vnode.attrs.options.businessUse(true)
		}
	}

	view(vnode: Vnode<SubscriptionSelectorAttr>): Children {
		// Add BuyOptionBox margin twice to the boxWidth received
		const columnWidth = vnode.attrs.boxWidth + BOX_MARGIN * 2
		const inMobileView: boolean = (this.containerDOM && this.containerDOM.clientWidth < columnWidth * 2) == true
		const featureExpander = this.renderFeatureExpanders(inMobileView, vnode.attrs.featureListProvider) // renders all feature expanders, both for every single subscription option but also for the whole list
		let additionalInfo: Children

		const acceptedPlans = vnode.attrs.acceptedPlans
		let plans: AvailablePlanType[]
		const currentPlan = vnode.attrs.currentPlanType
		const signup = currentPlan == null

		const onlyBusinessPlansAccepted = acceptedPlans.every((plan) => NewBusinessPlans.includes(plan))
		// show the business segmentControl for signup, if on a personal plan or if also personal plans are accepted
		let showBusinessSelector = signup || NewPersonalPlans.includes(downcast(currentPlan)) || !onlyBusinessPlansAccepted

		let subscriptionPeriodInfoMsg = !signup && currentPlan !== PlanType.Free ? lang.get("switchSubscriptionInfo_msg") + " " : ""
		if (vnode.attrs.options.businessUse()) {
			plans = [PlanType.Essential, PlanType.Advanced, PlanType.Unlimited]
			subscriptionPeriodInfoMsg += lang.get("pricing.subscriptionPeriodInfoBusiness_msg")
			additionalInfo = m(".flex.flex-column.items-center", [
				featureExpander.All, // global feature expander
				m(".smaller.mb.center", subscriptionPeriodInfoMsg),
			])
		} else {
			if (inMobileView) {
				plans = [PlanType.Revolutionary, PlanType.Legend, PlanType.Free]
			} else {
				plans = [PlanType.Free, PlanType.Revolutionary, PlanType.Legend]
			}
			subscriptionPeriodInfoMsg += lang.get("pricing.subscriptionPeriodInfoPrivate_msg")
			additionalInfo = m(".flex.flex-column.items-center", [
				featureExpander.All, // global feature expander
				m(".smaller.mb.center", subscriptionPeriodInfoMsg),
			])
			showBusinessSelector = true
		}
		const buyBoxesViewPlacement = plans
			.filter((plan) => acceptedPlans.includes(plan) || vnode.attrs.currentPlanType === plan)
			.map((personalPlan, i) => {
				// only show category title for the leftmost item
				return this.renderBuyOptionBox(vnode.attrs, i === 0, inMobileView, personalPlan, featureExpander)
			})

		const isYearly = vnode.attrs.options.paymentInterval() === 12

		const showCurrentPlanDiscontinuedHint = vnode.attrs.currentPlanType != null && LegacyPlans.includes(vnode.attrs.currentPlanType)
		return [
			showBusinessSelector
				? m(SegmentControl, {
						selectedValue: vnode.attrs.options.businessUse(),
						onValueSelected: vnode.attrs.options.businessUse,
						items: BusinessUseItems,
				  })
				: null,
			m(".flex-center.items-center.mt", [
				vnode.attrs.priceInfoTextId && lang.exists(vnode.attrs.priceInfoTextId) ? m(".b.center", lang.get(vnode.attrs.priceInfoTextId)) : null,
			]),
			vnode.attrs.msg ? m(".b.center.mt", lang.getMaybeLazy(vnode.attrs.msg)) : null,
			showCurrentPlanDiscontinuedHint ? m(".b.center.mt", lang.get("currentPlanDiscontinued_msg")) : null,
			m(
				".flex.center-horizontally.wrap",
				{
					oncreate: (vnode) => {
						this.containerDOM = vnode.dom as HTMLElement
						m.redraw()
					},
				},
				buyBoxesViewPlacement,
				additionalInfo,
			),
		]
	}

	private renderBuyOptionBox(
		attrs: SubscriptionSelectorAttr,
		renderCategoryTitle: boolean,
		inMobileView: boolean,
		planType: AvailablePlanType,
		featureExpander: Record<ExpanderTargets, m.Children>,
	): Children {
		return m("", [m(BuyOptionBox, this.createBuyOptionBoxAttr(attrs, planType, renderCategoryTitle, inMobileView)), featureExpander[planType]])
	}

	private createBuyOptionBoxAttr(
		selectorAttrs: SubscriptionSelectorAttr,
		targetSubscription: AvailablePlanType,
		renderCategoryTitle: boolean,
		mobile: boolean,
	): BuyOptionBoxAttr {
		const { featureListProvider, priceAndConfigProvider } = selectorAttrs
		const subscriptionFeatures = featureListProvider.getFeatureList(targetSubscription)
		const categoriesToShow = subscriptionFeatures.categories
			.map((fc) => {
				return localizeFeatureCategory(fc, targetSubscription, selectorAttrs)
			})
			.filter((fc): fc is BuyOptionBoxAttr["categories"][0] => fc != null)

		// we only highlight the private Premium box if this is a signup or the current subscription type is Free
		selectorAttrs.highlightPremium = targetSubscription === PlanType.Revolutionary && !selectorAttrs.options.businessUse() && !selectorAttrs.currentPlanType
		const subscriptionPrice = priceAndConfigProvider.getSubscriptionPrice(
			selectorAttrs.options.paymentInterval(),
			targetSubscription,
			UpgradePriceType.PlanActualPrice,
		)
		const multiuser = NewBusinessPlans.includes(targetSubscription) || LegacyPlans.includes(targetSubscription) || selectorAttrs.multipleUsersAllowed
		return {
			heading: getDisplayNameOfPlanType(targetSubscription),
			actionButton:
				selectorAttrs.currentPlanType === targetSubscription
					? getActiveSubscriptionActionButtonReplacement()
					: getActionButtonBySubscription(selectorAttrs.actionButtons, targetSubscription),
			price: formatMonthlyPrice(subscriptionPrice, selectorAttrs.options.paymentInterval()),
			priceHint: getPriceHint(subscriptionPrice, selectorAttrs.options.paymentInterval(), multiuser),
			helpLabel: getHelpLabel(targetSubscription, selectorAttrs.options.businessUse()),
			categories: categoriesToShow,
			featuresExpanded: this.featuresExpanded[targetSubscription] || this.featuresExpanded.All,
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: selectorAttrs.allowSwitchingPaymentInterval && targetSubscription !== PlanType.Free ? selectorAttrs.options.paymentInterval : null,
			highlighted: selectorAttrs.highlightPremium,
			showReferenceDiscount: selectorAttrs.allowSwitchingPaymentInterval,
			renderCategoryTitle,
			mobile,
			bonusMonths:
				targetSubscription !== PlanType.Free && selectorAttrs.options.paymentInterval() === PaymentInterval.Yearly
					? Number(selectorAttrs.priceAndConfigProvider.getRawPricingData().bonusMonthsForYearlyPlan)
					: 0,
		}
	}

	/**
	 * Renders the feature expanders depending on whether currently displaying the feature list in single-column layout or in multi-column layout.
	 * If a specific expander is not needed and thus should not be renderer, null | undefined is returned
	 */
	private renderFeatureExpanders(inMobileView: boolean | null, featureListProvider: FeatureListProvider): Record<ExpanderTargets, Children> {
		if (!featureListProvider.featureLoadingDone()) {
			// the feature list is not available
			return {
				[PlanType.Free]: null,
				[PlanType.Revolutionary]: null,
				[PlanType.Legend]: null,
				[PlanType.Essential]: null,
				[PlanType.Advanced]: null,
				[PlanType.Unlimited]: null,
				All: null,
			}
		}
		if (inMobileView) {
			// In single-column layout every subscription type has its own feature expander.
			if (this.featuresExpanded.All) {
				for (const k in this.featuresExpanded) {
					this.featuresExpanded[k as ExpanderTargets] = true
				}
			}
			return {
				[PlanType.Free]: this.renderExpander(PlanType.Free),
				[PlanType.Revolutionary]: this.renderExpander(PlanType.Revolutionary),
				[PlanType.Legend]: this.renderExpander(PlanType.Legend),
				[PlanType.Advanced]: this.renderExpander(PlanType.Advanced),
				[PlanType.Essential]: this.renderExpander(PlanType.Essential),
				[PlanType.Unlimited]: this.renderExpander(PlanType.Unlimited),
				All: null,
			}
		} else {
			for (const k in this.featuresExpanded) {
				this.featuresExpanded[k as ExpanderTargets] = this.featuresExpanded.All // in multi-column layout the specific feature expanders should follow the global one
			}
			return Object.assign({} as Record<ExpanderTargets, Children>, { All: this.renderExpander("All") })
		}
	}

	/**
	 * Renders a single feature expander.
	 * @param subType The current expander that should be rendered
	 * @private
	 */
	private renderExpander(subType: ExpanderTargets): Children {
		return this.featuresExpanded[subType]
			? null
			: m(
					".mb-l.content-hover.button.cursor-pointer.text-fade.center",
					{
						role: "button",
						onclick: (e: Event) => {
							this.featuresExpanded[subType] = !this.featuresExpanded[subType]
							e.preventDefault()
						},
					},
					lang.get("pricing.showAllFeatures"),
			  )
	}
}

function localizeFeatureListItem(
	item: FeatureListItem,
	targetSubscription: PlanType,
	attrs: SubscriptionSelectorAttr,
): BuyOptionBoxAttr["categories"][0]["features"][0] | null {
	let text = tryGetTranslation(item.text, getReplacement(item.replacements, targetSubscription, attrs))
	if (text == null) {
		return null
	}
	if (!item.toolTip) {
		return { text, key: item.text, antiFeature: item.antiFeature, omit: item.omit, heart: item.heart ? true : false }
	} else {
		const toolTipText = tryGetTranslation(item.toolTip)
		if (toolTipText === null) {
			return null
		}
		const toolTip = item.toolTip.endsWith("_markdown") ? m.trust(toolTipText) : toolTipText
		return { text, toolTip, key: item.text, antiFeature: item.antiFeature, omit: item.omit, heart: item.heart ? true : false }
	}
}

function localizeFeatureCategory(
	category: FeatureCategory,
	targetSubscription: PlanType,
	attrs: SubscriptionSelectorAttr,
): BuyOptionBoxAttr["categories"][0] | null {
	const title = tryGetTranslation(category.title)
	const features = downcast<{ text: string; toolTip?: m.Child; key: string; antiFeature?: boolean | undefined; omit: boolean; heart: boolean }[]>(
		category.features.map((f) => localizeFeatureListItem(f, targetSubscription, attrs)).filter((it) => it != null),
	)
	return { title, key: category.title, features, featureCount: category.featureCount }
}

function tryGetTranslation(key: TranslationKey, replacements?: Record<string, string | number>): string | null {
	try {
		return lang.get(key, replacements)
	} catch (e) {
		console.log("could not translate feature text for key", key, "hiding feature item")
		return null
	}
}

/**
 * get a string to insert into a translation with a slot.
 * if no key is found, undefined is returned and nothing is replaced.
 */
export function getReplacement(
	key: ReplacementKey | undefined,
	subscription: PlanType,
	attrs: SubscriptionSelectorAttr,
): Record<string, string | number> | undefined {
	const { priceAndConfigProvider, options } = attrs
	switch (key) {
		case "customDomains":
			return { "{amount}": priceAndConfigProvider.getPlanPrices(subscription).customDomains }
		case "mailAddressAliases":
			return { "{amount}": priceAndConfigProvider.getPlanPrices(subscription).includedAliases }
		case "storage":
			return { "{amount}": priceAndConfigProvider.getPlanPrices(subscription).includedStorage }
		case "contactForm":
			const subscriptionPriceContact = priceAndConfigProvider.getSubscriptionPrice(
				options.paymentInterval(),
				subscription,
				UpgradePriceType.ContactFormPrice,
			)
			return { "{price}": formatMonthlyPrice(subscriptionPriceContact, attrs.options.paymentInterval()) }
	}
}

function getHelpLabel(planType: PlanType, businessUse: boolean): TranslationKey {
	if (planType === PlanType.Free) return "pricing.upgradeLater_msg"
	return businessUse ? "pricing.excludesTaxes_msg" : "pricing.includesTaxes_msg"
}

function getPriceHint(subscriptionPrice: number, paymentInterval: PaymentInterval, multiuser: boolean): TranslationKey {
	if (subscriptionPrice > 0) {
		if (multiuser) {
			return paymentInterval === PaymentInterval.Yearly ? "pricing.perUserMonthPaidYearly_label" : "pricing.perUserMonth_label"
		} else {
			return paymentInterval === PaymentInterval.Yearly ? "pricing.perMonthPaidYearly_label" : "pricing.perMonth_label"
		}
	} else {
		return "emptyString_msg"
	}
}
