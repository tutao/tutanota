import m, { Children, Component, Vnode } from "mithril"
import type { MaybeTranslation, TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { BuyOptionBoxAttr, BuyOptionDetailsAttr } from "./BuyOptionBox"
import { BOX_MARGIN, BuyOptionBox, BuyOptionDetails, getActiveSubscriptionActionButtonReplacement } from "./BuyOptionBox"
import type { SegmentControlItem } from "../gui/base/SegmentControl"
import { SegmentControl } from "../gui/base/SegmentControl"
import { formatMonthlyPrice, PaymentInterval, PriceAndConfigProvider, PriceType } from "./utils/PriceUtils"
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
import { assertNotNull, downcast, lazy, NBSP } from "@tutao/tutanota-utils"
import {
	AvailablePlanType,
	CustomDomainType,
	CustomDomainTypeCountName,
	HighlightedPlans,
	LegacyPlans,
	NewBusinessPlans,
	NewPersonalPlans,
	PaymentMethodType,
	PlanType,
	PlanTypeToName,
} from "../api/common/TutanotaConstants.js"
import { px, size } from "../gui/size.js"
import { LoginButton, LoginButtonAttrs } from "../gui/base/buttons/LoginButton.js"
import { isIOSApp } from "../api/common/Env"
import { locator } from "../api/main/CommonLocator.js"
import { getApplePriceStr, getPriceStr, hasAppleIntroOffer, shouldHideBusinessPlans, shouldShowApplePrices, UpgradeType } from "./utils/SubscriptionUtils.js"
import { AccountingInfo } from "../api/entities/sys/TypeRefs.js"

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
	acceptedPlans: readonly AvailablePlanType[]
	multipleUsersAllowed: boolean
	msg: MaybeTranslation | null
	upgradeType?: UpgradeType
	accountingInfo: AccountingInfo | null
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

	private renderHeadline(
		msg: MaybeTranslation | null,
		priceAndConfigProvider: PriceAndConfigProvider,
		currentPlanType: PlanType | null,
		priceInfoTextId: TranslationKey | null,
		isBusiness: boolean,
		isCampaign: boolean,
		isFirstMonthForFree: boolean,
	): Children {
		const wrapInDiv = (text: string, style?: Record<string, any>) => {
			return m(".b.center", { style }, text)
		}

		if (msg) {
			return wrapInDiv(lang.getTranslationText(msg))
		} else if (currentPlanType != null && LegacyPlans.includes(currentPlanType)) {
			return wrapInDiv(lang.get("currentPlanDiscontinued_msg"))
		}

		if (priceInfoTextId && lang.exists(priceInfoTextId)) {
			return wrapInDiv(lang.get(priceInfoTextId))
		}

		if (isFirstMonthForFree) {
			return wrapInDiv(lang.get("firstMonthForFree_msg"), { marginTop: px(size.spacing_16), marginBottom: px(size.spacing_16) })
		}

		if (isCampaign && !isBusiness && (isIOSApp() ? priceAndConfigProvider.getIosIntroOfferEligibility() : true)) {
			// The headline text for the Go European campaign should be always English
			const text = isIOSApp() ? "One-time offer: Save now!" : "One-time offer: Save 50% now!"
			return wrapInDiv(text, { margin: "1em auto 0 auto" })
		}
	}

	view(vnode: Vnode<SubscriptionSelectorAttr>): Children {
		// Add BuyOptionBox margin twice to the boxWidth received
		const { acceptedPlans, priceInfoTextId, priceAndConfigProvider, msg, featureListProvider, currentPlanType, options, boxWidth, accountingInfo } =
			vnode.attrs

		const columnWidth = boxWidth + BOX_MARGIN * 2
		const inMobileView: boolean = this.containerDOM != null && this.containerDOM.clientWidth < columnWidth * 2
		const featureExpander = this.renderFeatureExpanders(inMobileView, featureListProvider) // renders all feature expanders, both for every single subscription option but also for the whole list
		let additionalInfo: Children

		let plans: AvailablePlanType[]
		const currentPlan = currentPlanType
		const signup = currentPlan == null

		const onlyBusinessPlansAccepted = acceptedPlans.every((plan) => NewBusinessPlans.includes(plan))
		const onlyPersonalPlansAccepted = acceptedPlans.every((plan) => NewPersonalPlans.includes(plan))
		// Show the business segmentControl for signup, if both personal & business plans are allowed
		const showBusinessSelector = !onlyBusinessPlansAccepted && !onlyPersonalPlansAccepted && !shouldHideBusinessPlans()

		const isApplePrice = shouldShowApplePrices(accountingInfo)
		const hasCampaign = isApplePrice
			? priceAndConfigProvider.getIosIntroOfferEligibility() && hasAppleIntroOffer(priceAndConfigProvider)
			: priceAndConfigProvider.getRawPricingData().hasGlobalFirstYearDiscount

		let subscriptionPeriodInfoMsg = !signup && currentPlan !== PlanType.Free ? lang.get("switchSubscriptionInfo_msg") + " " : ""
		if (options.businessUse()) {
			plans = [PlanType.Essential, PlanType.Advanced, PlanType.Unlimited]
			subscriptionPeriodInfoMsg += lang.get("pricing.subscriptionPeriodInfoBusiness_msg")
		} else {
			if (inMobileView) {
				plans = [PlanType.Revolutionary, PlanType.Legend, PlanType.Free]
			} else {
				plans = [PlanType.Free, PlanType.Revolutionary, PlanType.Legend]
			}

			subscriptionPeriodInfoMsg += lang.get("pricing.subscriptionPeriodInfoPrivate_msg")
		}

		const isYearly = options.paymentInterval() === PaymentInterval.Yearly

		const getFootnoteElement: () => Children = () => {
			if (hasCampaign && !options.businessUse() && isYearly) {
				const getRevoPriceStrProps = {
					priceAndConfigProvider,
					paymentInterval: PaymentInterval.Yearly,
					targetPlan: PlanType.Revolutionary,
				}
				const { referencePriceStr: revoRefPriceStr } = isApplePrice ? getApplePriceStr(getRevoPriceStrProps) : getPriceStr(getRevoPriceStrProps)

				const getLegendPriceStrProps = {
					priceAndConfigProvider,
					paymentInterval: PaymentInterval.Yearly,
					targetPlan: PlanType.Legend,
				}
				const { referencePriceStr: legendRefPriceStr } = isApplePrice ? getApplePriceStr(getLegendPriceStrProps) : getPriceStr(getLegendPriceStrProps)

				if (!revoRefPriceStr || !legendRefPriceStr) return

				return m(
					".flex.column-gap-4",
					m("span", m("sup", "1")),
					m(
						"span",
						lang.get(isApplePrice ? "pricing.firstYearDiscountIos_revo_legend_msg" : "pricing.firstYearDiscount_revo_legend_msg", {
							"{revo-price}": revoRefPriceStr,
							"{legend-price}": legendRefPriceStr,
						}),
					),
				)
			}

			if (priceAndConfigProvider.getRawPricingData().firstMonthForFreeForYearlyPlan && isYearly && (!currentPlan || currentPlan === PlanType.Free)) {
				return m(".flex.column-gap-4", m("span", m("sup", "1")), m("span", lang.get("firstMonthForFreeDetail_msg")))
			}

			return undefined
		}

		const footnoteElement = getFootnoteElement()

		additionalInfo = m(".flex.flex-column", [
			featureExpander.All, // global feature expander
			m(".smaller.mb-16", subscriptionPeriodInfoMsg),
			footnoteElement && m(".smaller.mb-16", footnoteElement),
		])

		const buyBoxesViewPlacement = plans
			.filter((plan) => acceptedPlans.includes(plan) || currentPlanType === plan)
			.map((personalPlan, i) => {
				const isPersonalPaidPlan = personalPlan === PlanType.Legend || personalPlan === PlanType.Revolutionary

				const hasFirstYearDiscount = (() => {
					if (shouldShowApplePrices(accountingInfo)) {
						const prices = priceAndConfigProvider.getMobilePrices().get(PlanTypeToName[personalPlan].toLowerCase())
						return isYearly && !!prices?.isEligibleForIntroOffer && !!prices?.displayOfferYearlyPerYear
					} else {
						return hasCampaign && isPersonalPaidPlan && isYearly
					}
				})()

				// only show category title for the leftmost item
				return [
					this.renderBuyOptionBox(vnode.attrs, inMobileView, personalPlan, hasFirstYearDiscount),
					this.renderBuyOptionDetails(vnode.attrs, i === 0, personalPlan, featureExpander, hasFirstYearDiscount),
				]
			})

		return m("", { lang: lang.code }, [
			showBusinessSelector
				? m(SegmentControl, {
						selectedValue: options.businessUse(),
						onValueSelected: (isBusinessUse: boolean) => {
							if (isBusinessUse) {
								if (vnode.attrs.upgradeType === UpgradeType.Signup) {
									const usageTest = locator.usageTestController.getTest("signup.paywall.business")
									const stage = usageTest.getStage(0)
									stage.setMetric({
										name: "variant",
										value: "A",
									})
									void stage.complete()
								}
							}

							return options.businessUse(isBusinessUse)
						},
						items: BusinessUseItems,
					})
				: null,
			this.renderHeadline(
				msg,
				priceAndConfigProvider,
				currentPlanType,
				priceInfoTextId,
				options.businessUse(),
				hasCampaign,
				priceAndConfigProvider.getRawPricingData().firstMonthForFreeForYearlyPlan && (!currentPlanType || currentPlanType === PlanType.Free),
			),
			m(
				".flex.center-horizontally.wrap",
				{
					"data-testid": "dialog:select-subscription",
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

	/**
	 * Retrieves the reference prices for the "Revolutionary" and "Legend" plans.
	 */
	private getReferencePrices({
		priceAndConfigProvider,
		accountingInfo,
	}: {
		priceAndConfigProvider: PriceAndConfigProvider
		accountingInfo: AccountingInfo | null
	}): { revoPrice: string; legendPrice: string } {
		if (shouldShowApplePrices(accountingInfo)) {
			const prices = priceAndConfigProvider.getMobilePrices()

			return {
				revoPrice: assertNotNull(prices.get(PlanTypeToName[PlanType.Revolutionary].toLowerCase())).displayYearlyPerYear,
				legendPrice: assertNotNull(prices.get(PlanTypeToName[PlanType.Legend].toLowerCase())).displayYearlyPerYear,
			}
		}

		return {
			revoPrice: formatMonthlyPrice(
				priceAndConfigProvider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.PlanReferencePrice) * 12,
				PaymentInterval.Yearly,
			),
			legendPrice: formatMonthlyPrice(
				priceAndConfigProvider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Legend, UpgradePriceType.PlanReferencePrice) * 12,
				PaymentInterval.Yearly,
			),
		}
	}

	private renderBuyOptionBox(attrs: SubscriptionSelectorAttr, inMobileView: boolean, planType: AvailablePlanType, hasFirstYearDiscount: boolean): Children {
		return m(
			"",
			{
				style: {
					width: attrs.boxWidth ? px(attrs.boxWidth) : px(230),
				},
			},
			m(BuyOptionBox, this.createBuyOptionBoxAttr(attrs, planType, inMobileView, hasFirstYearDiscount)),
		)
	}

	private renderBuyOptionDetails(
		attrs: SubscriptionSelectorAttr,
		renderCategoryTitle: boolean,
		planType: AvailablePlanType,
		featureExpander: Record<ExpanderTargets, Children>,
		isCampaign: boolean, // change to isDiscountForAnyPlanAvailable when removing the campaign implementation
	): Children {
		return m(
			"",
			{
				style: { width: attrs.boxWidth ? px(attrs.boxWidth) : px(230) },
			},
			m(BuyOptionDetails, this.createBuyOptionBoxDetailsAttr(attrs, planType, renderCategoryTitle, isCampaign)),
			featureExpander[planType],
		)
	}

	private createBuyOptionBoxAttr(
		selectorAttrs: SubscriptionSelectorAttr,
		targetSubscription: AvailablePlanType,
		mobile: boolean,
		hasFirstYearDiscount: boolean,
	): BuyOptionBoxAttr {
		const { priceAndConfigProvider } = selectorAttrs

		// we highlight the center box if this is a signup or the current subscription type is Free
		const interval = selectorAttrs.options.paymentInterval()
		const upgradingToPaidAccount = !selectorAttrs.currentPlanType || selectorAttrs.currentPlanType === PlanType.Free
		// If we are on a campaign, we want to let the user know the discount is just for the first year.
		const isYearly = interval === PaymentInterval.Yearly
		const paymentMethod = selectorAttrs.accountingInfo?.paymentMethod ?? null
		const isHighlighted = hasFirstYearDiscount || (upgradingToPaidAccount && HighlightedPlans.includes(targetSubscription))

		const multiuser = NewBusinessPlans.includes(targetSubscription) || LegacyPlans.includes(targetSubscription) || selectorAttrs.multipleUsersAllowed

		const subscriptionPrice = priceAndConfigProvider.getSubscriptionPrice(interval, targetSubscription, UpgradePriceType.PlanActualPrice)

		let priceStr: string
		let referencePriceStr: string | undefined = undefined
		let priceType: PriceType
		if (isIOSApp() && (!paymentMethod || paymentMethod === PaymentMethodType.AppStore)) {
			const prices = priceAndConfigProvider.getMobilePrices().get(PlanTypeToName[targetSubscription].toLowerCase())
			if (prices != null) {
				switch (interval) {
					case PaymentInterval.Monthly:
						priceStr = prices.displayMonthlyPerMonth
						priceType = PriceType.MonthlyPerMonth
						break
					case PaymentInterval.Yearly: {
						if (hasFirstYearDiscount) {
							priceStr = prices.displayOfferYearlyPerYear!
							referencePriceStr = prices.displayYearlyPerYear
						} else {
							priceStr = prices.displayYearlyPerYear
						}

						priceType = PriceType.YearlyPerYear
					}
				}
			} else {
				// when can this happen?
				priceType = PriceType.MonthlyPerMonth
				priceStr = NBSP
				referencePriceStr = NBSP
			}
		} else {
			priceType = interval === PaymentInterval.Monthly ? PriceType.MonthlyPerMonth : PriceType.YearlyPerMonth
			const referencePrice = priceAndConfigProvider.getSubscriptionPrice(interval, targetSubscription, UpgradePriceType.PlanReferencePrice)
			priceStr = formatMonthlyPrice(subscriptionPrice, interval)
			if (referencePrice > subscriptionPrice) {
				// if there is a discount for this plan we show the original price as reference
				referencePriceStr = formatMonthlyPrice(referencePrice, interval)
			} else if (interval === PaymentInterval.Yearly && subscriptionPrice !== 0 && !hasFirstYearDiscount) {
				// if there is no discount for any plan then we show the monthly price as reference
				const monthlyReferencePrice = priceAndConfigProvider.getSubscriptionPrice(
					PaymentInterval.Monthly,
					targetSubscription,
					UpgradePriceType.PlanActualPrice,
				)
				referencePriceStr = formatMonthlyPrice(monthlyReferencePrice, PaymentInterval.Monthly)
			}
		}

		const appliesFirstMonthForFree =
			priceAndConfigProvider.getRawPricingData().firstMonthForFreeForYearlyPlan &&
			isYearly &&
			// Not showing first month free offer for the paid plan switching
			(!selectorAttrs.currentPlanType || selectorAttrs.currentPlanType === PlanType.Free) &&
			targetSubscription !== PlanType.Free

		return {
			heading: getDisplayNameOfPlanType(targetSubscription),
			actionButton:
				selectorAttrs.currentPlanType === targetSubscription
					? getActiveSubscriptionActionButtonReplacement()
					: getActionButtonBySubscription(selectorAttrs.actionButtons, targetSubscription),
			price: priceStr,
			referencePrice: referencePriceStr,
			priceHint: lang.makeTranslation("price_hint", `${getPriceHint(subscriptionPrice, priceType, multiuser)}`),
			hasPriceFootnote: appliesFirstMonthForFree || hasFirstYearDiscount,
			helpLabel: getHelpLabel(targetSubscription, selectorAttrs.options.businessUse()),
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			selectedPaymentInterval:
				selectorAttrs.allowSwitchingPaymentInterval && targetSubscription !== PlanType.Free ? selectorAttrs.options.paymentInterval : null,
			accountPaymentInterval: interval,
			highlighted: isHighlighted,
			mobile,
			bonusMonths:
				targetSubscription !== PlanType.Free && isYearly
					? Number(selectorAttrs.priceAndConfigProvider.getRawPricingData().bonusMonthsForYearlyPlan)
					: 0,
			targetSubscription,
			hasFirstYearDiscount: hasFirstYearDiscount,
			isFirstMonthForFree: appliesFirstMonthForFree,
			isApplePrice: shouldShowApplePrices(selectorAttrs.accountingInfo),
		}
	}

	private createBuyOptionBoxDetailsAttr(
		selectorAttrs: SubscriptionSelectorAttr,
		targetSubscription: AvailablePlanType,
		renderCategoryTitle: boolean,
		hasFirstYearDiscount: boolean,
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
			iconStyle: hasFirstYearDiscount ? { fill: "#e5c650" } : undefined,
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
	const text = tryGetTranslation(item.text, getReplacement(item.replacements, targetSubscription, attrs))
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
	const features = downcast<
		{
			text: string
			toolTip?: m.Child
			key: string
			antiFeature?: boolean | undefined
			omit: boolean
			heart: boolean
		}[]
	>(category.features.map((f) => localizeFeatureListItem(f, targetSubscription, attrs)).filter((it) => it != null))
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
		case "customDomains": {
			const customDomainType = downcast<CustomDomainType>(priceAndConfigProvider.getPlanPricesForPlan(subscription).planConfiguration.customDomainType)
			return { "{amount}": CustomDomainTypeCountName[customDomainType] }
		}
		case "mailAddressAliases":
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).planConfiguration.nbrOfAliases }
		case "storage":
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).planConfiguration.storageGb }
		case "label": {
			return { "{amount}": priceAndConfigProvider.getPlanPricesForPlan(subscription).planConfiguration.maxLabels }
		}
	}
}

function getHelpLabel(planType: PlanType, businessUse: boolean): TranslationKey {
	if (planType === PlanType.Free) return "pricing.upgradeLater_msg"
	return businessUse ? "pricing.excludesTaxes_msg" : "pricing.includesTaxes_msg"
}

function getPriceHint(subscriptionPrice: number, priceType: PriceType, multiuser: boolean): string {
	if (subscriptionPrice > 0) {
		switch (priceType) {
			case PriceType.YearlyPerYear:
				// we do not support multiuser here
				return lang.get("pricing.perYear_label")
			case PriceType.YearlyPerMonth:
				if (multiuser) {
					return lang.get("pricing.perUserMonthPaidYearly_label")
				} else {
					return lang.get("pricing.perMonthPaidYearly_label")
				}
			case PriceType.MonthlyPerMonth:
				if (multiuser) {
					return lang.get("pricing.perUserMonth_label")
				} else {
					return lang.get("pricing.perMonth_label")
				}
		}
	}
	return ""
}
