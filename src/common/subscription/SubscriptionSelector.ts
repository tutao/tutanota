import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey, TranslationText } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { BuyOptionBoxAttr, BuyOptionDetailsAttr } from "./BuyOptionBox"
import { BOX_MARGIN, BuyOptionBox, BuyOptionDetails, getActiveSubscriptionActionButtonReplacement } from "./BuyOptionBox"
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
import { Button, ButtonType } from "../gui/base/Button.js"
import { downcast, lazy, NBSP } from "@tutao/tutanota-utils"
import {
	AvailablePlanType,
	HighlightedPlans,
	LegacyPlans,
	NewBusinessPlans,
	NewPersonalPlans,
	PlanType,
	PlanTypeToName,
} from "../api/common/TutanotaConstants.js"
import { px } from "../gui/size.js"
import { LoginButton, LoginButtonAttrs } from "../gui/base/buttons/LoginButton.js"
import { isIOSApp } from "../api/common/Env"
import { client } from "../misc/ClientDetector"

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

export type SubscriptionActionButtons = Record<AvailablePlanType, lazy<LoginButtonAttrs>>

export type SubscriptionSelectorAttr = {
	options: SelectedSubscriptionOptions
	priceInfoTextId: TranslationKey | null
	actionButtons: SubscriptionActionButtons
	boxWidth: number
	boxHeight: number
	currentPlanType: PlanType | null
	allowSwitchingPaymentInterval: boolean
	featureListProvider: FeatureListProvider
	priceAndConfigProvider: PriceAndConfigProvider
	acceptedPlans: AvailablePlanType[]
	multipleUsersAllowed: boolean
	msg: TranslationText | null
}

export function getActionButtonBySubscription(actionButtons: SubscriptionActionButtons, subscription: AvailablePlanType): lazy<Children> {
	const ret = actionButtons[subscription]
	if (ret == null) {
		throw new ProgrammingError("Plan is not valid")
	}
	return () => m(LoginButton, ret())
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
		const onlyPersonalPlansAccepted = acceptedPlans.every((plan) => NewPersonalPlans.includes(plan))
		// Show the business segmentControl for signup, if both personal & business plans are allowed
		const showBusinessSelector = !onlyBusinessPlansAccepted && !onlyPersonalPlansAccepted && !isIOSApp()

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
		}
		const buyBoxesViewPlacement = plans
			.filter((plan) => acceptedPlans.includes(plan) || vnode.attrs.currentPlanType === plan)
			.map((personalPlan, i) => {
				// only show category title for the leftmost item
				return [
					this.renderBuyOptionBox(vnode.attrs, inMobileView, personalPlan),
					this.renderBuyOptionDetails(vnode.attrs, i === 0, personalPlan, featureExpander),
				]
			})

		const changePlanMessage = vnode.attrs.msg
			? lang.getMaybeLazy(vnode.attrs.msg)
			: vnode.attrs.currentPlanType != null && LegacyPlans.includes(vnode.attrs.currentPlanType)
			? lang.get("currentPlanDiscontinued_msg")
			: null
		return m("", { lang: lang.code }, [
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
			changePlanMessage ? m(".b.center.mt", changePlanMessage) : null,
			m(
				".flex.center-horizontally.wrap",
				{
					oncreate: (vnode) => {
						this.containerDOM = vnode.dom as HTMLElement
						m.redraw()
					},
					style: {
						"column-gap": px(BOX_MARGIN),
					},
				},
				m(".plans-grid", buyBoxesViewPlacement.flat()),
				additionalInfo,
			),
		])
	}

	private renderBuyOptionBox(attrs: SubscriptionSelectorAttr, inMobileView: boolean, planType: AvailablePlanType): Children {
		return m(
			"",
			{
				style: {
					width: attrs.boxWidth ? px(attrs.boxWidth) : px(230),
				},
			},
			m(BuyOptionBox, this.createBuyOptionBoxAttr(attrs, planType, inMobileView)),
		)
	}

	private renderBuyOptionDetails(
		attrs: SubscriptionSelectorAttr,
		renderCategoryTitle: boolean,
		planType: AvailablePlanType,
		featureExpander: Record<ExpanderTargets, m.Children>,
	): Children {
		return m(
			"",
			{
				style: { width: attrs.boxWidth ? px(attrs.boxWidth) : px(230) },
			},
			m(BuyOptionDetails, this.createBuyOptionBoxDetailsAttr(attrs, planType, renderCategoryTitle)),
			featureExpander[planType],
		)
	}

	private createBuyOptionBoxAttr(selectorAttrs: SubscriptionSelectorAttr, targetSubscription: AvailablePlanType, mobile: boolean): BuyOptionBoxAttr {
		const { priceAndConfigProvider } = selectorAttrs

		// we highlight the center box if this is a signup or the current subscription type is Free
		const interval = selectorAttrs.options.paymentInterval()
		const upgradingToPaidAccount = !selectorAttrs.currentPlanType || selectorAttrs.currentPlanType === PlanType.Free
		const highlighted = upgradingToPaidAccount && HighlightedPlans.includes(targetSubscription)
		const subscriptionPrice = priceAndConfigProvider.getSubscriptionPrice(interval, targetSubscription, UpgradePriceType.PlanActualPrice)
		const multiuser = NewBusinessPlans.includes(targetSubscription) || LegacyPlans.includes(targetSubscription) || selectorAttrs.multipleUsersAllowed

		let price: string
		if (isIOSApp() && !client.isCalendarApp()) {
			const prices = priceAndConfigProvider.getMobilePrices().get(PlanTypeToName[targetSubscription].toLowerCase())
			if (prices != null) {
				switch (interval) {
					case PaymentInterval.Monthly:
						price = prices.monthlyPerMonth
						break
					case PaymentInterval.Yearly:
						price = prices.yearlyPerMonth
						break
				}
			} else {
				price = NBSP
			}
		} else {
			price = formatMonthlyPrice(subscriptionPrice, interval)
		}

		return {
			heading: getDisplayNameOfPlanType(targetSubscription),
			actionButton:
				selectorAttrs.currentPlanType === targetSubscription
					? getActiveSubscriptionActionButtonReplacement()
					: getActionButtonBySubscription(selectorAttrs.actionButtons, targetSubscription),
			price,
			priceHint: getPriceHint(subscriptionPrice, interval, multiuser),
			helpLabel: getHelpLabel(targetSubscription, selectorAttrs.options.businessUse()),
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: selectorAttrs.allowSwitchingPaymentInterval && targetSubscription !== PlanType.Free ? selectorAttrs.options.paymentInterval : null,
			highlighted: highlighted,
			showReferenceDiscount: selectorAttrs.allowSwitchingPaymentInterval,
			mobile,
			bonusMonths:
				targetSubscription !== PlanType.Free && interval === PaymentInterval.Yearly
					? Number(selectorAttrs.priceAndConfigProvider.getRawPricingData().bonusMonthsForYearlyPlan)
					: 0,
		}
	}

	private createBuyOptionBoxDetailsAttr(
		selectorAttrs: SubscriptionSelectorAttr,
		targetSubscription: AvailablePlanType,
		renderCategoryTitle: boolean,
	): BuyOptionDetailsAttr {
		const { featureListProvider } = selectorAttrs
		const subscriptionFeatures = featureListProvider.getFeatureList(targetSubscription)
		const categoriesToShow = subscriptionFeatures.categories
			.map((fc) => {
				return localizeFeatureCategory(fc, targetSubscription, selectorAttrs)
			})
			.filter((fc): fc is BuyOptionDetailsAttr["categories"][0] => fc != null)
		return {
			categories: categoriesToShow,
			featuresExpanded: this.featuresExpanded[targetSubscription] || this.featuresExpanded.All,
			renderCategoryTitle,
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
			: m(Button, {
					label: "pricing.showAllFeatures",
					type: ButtonType.Secondary,
					click: (event) => {
						this.featuresExpanded[subType] = !this.featuresExpanded[subType]
						event.stopPropagation()
					},
			  })
	}
}

function localizeFeatureListItem(
	item: FeatureListItem,
	targetSubscription: PlanType,
	attrs: SubscriptionSelectorAttr,
): BuyOptionDetailsAttr["categories"][0]["features"][0] | null {
	let text = tryGetTranslation(item.text, getReplacement(item.replacements, targetSubscription, attrs))
	if (text == null) {
		return null
	}
	if (!item.toolTip) {
		return { text, key: item.text, antiFeature: item.antiFeature, omit: item.omit, heart: !!item.heart }
	} else {
		const toolTipText = tryGetTranslation(item.toolTip)
		if (toolTipText === null) {
			return null
		}
		const toolTip = item.toolTip.endsWith("_markdown") ? m.trust(toolTipText) : toolTipText
		return { text, toolTip, key: item.text, antiFeature: item.antiFeature, omit: item.omit, heart: !!item.heart }
	}
}

function localizeFeatureCategory(
	category: FeatureCategory,
	targetSubscription: PlanType,
	attrs: SubscriptionSelectorAttr,
): BuyOptionDetailsAttr["categories"][0] | null {
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
	const { priceAndConfigProvider } = attrs
	switch (key) {
		case "customDomains":
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).customDomains }
		case "mailAddressAliases":
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).includedAliases }
		case "storage":
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).includedStorage }
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
