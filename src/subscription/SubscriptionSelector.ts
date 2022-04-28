import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {BuyOptionBoxAttr} from "./BuyOptionBox"
import {BOX_MARGIN, BuyOptionBox, getActiveSubscriptionActionButtonReplacement} from "./BuyOptionBox"
import type {SubscriptionActionButtons, SubscriptionOptions, SubscriptionPlanPrices} from "./SubscriptionUtils"
import {
	getActionButtonBySubscription,
	getDisplayNameOfSubscriptionType,
	getPlanPrices,
	isDowngrade,
	subscriptions,
	SubscriptionType,
	UpgradePriceType,
} from "./SubscriptionUtils"
import type {SegmentControlAttrs, SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import {formatMonthlyPrice, formatPrice, getSubscriptionPrice, isYearlyPayment} from "./PriceUtils"

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
export type SubscriptionSelectorAttr = {
	options: SubscriptionOptions
	campaignInfoTextId: TranslationKey | null
	actionButtons: SubscriptionActionButtons
	boxWidth: number
	boxHeight: number
	currentSubscriptionType: SubscriptionType | null
	currentlySharingOrdered: boolean
	currentlyBusinessOrdered: boolean
	currentlyWhitelabelOrdered: boolean
	orderedContactForms: number
	isInitialUpgrade: boolean
	planPrices: SubscriptionPlanPrices
}

export class SubscriptionSelector implements Component<SubscriptionSelectorAttr> {
	private containerDOM: Element | null = null

	view(vnode: Vnode<SubscriptionSelectorAttr>): Children {
		let buyBoxesViewPlacement

		if (vnode.attrs.options.businessUse()) {
			buyBoxesViewPlacement = [
				m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.PremiumBusiness)),
				m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.TeamsBusiness)),
				m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Pro)),
				m(".smaller.mb", lang.get("downgradeToPrivateNotAllowed_msg")), //only displayed when business options are shown
			]
		} else {
			const currentSubscription = vnode.attrs.currentSubscriptionType
			// Add BuyOptionBox margin twice to the boxWidth received
			const columnWidth = vnode.attrs.boxWidth + BOX_MARGIN * 2
			const premiumBuyOptionBox = m(
				BuyOptionBox,
				currentSubscription === SubscriptionType.PremiumBusiness
					? this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.PremiumBusiness)
					: this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Premium),
			)
			const teamsBuyOptionBox = m(
				BuyOptionBox,
				currentSubscription === SubscriptionType.TeamsBusiness
					? this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.TeamsBusiness)
					: this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Teams),
			)
			const freeBuyOptionBox = m(BuyOptionBox, this.createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Free))

			// Changes order of BuyBoxes to Premium Pro Free, needed for mobile view (one column layout)
			if (this.containerDOM && this.containerDOM.clientWidth < columnWidth * 2) {
				buyBoxesViewPlacement = [premiumBuyOptionBox, teamsBuyOptionBox, freeBuyOptionBox]
			} else {
				buyBoxesViewPlacement = [freeBuyOptionBox, premiumBuyOptionBox, teamsBuyOptionBox]
			}
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
				m(".smaller.mb.center", vnode.attrs.options.businessUse() ? lang.get("subscriptionPeriodInfoBusiness_msg") : lang.get("subscriptionPeriodInfoPrivate_msg"))
			),
		]
	}

	private getCurrentPlanInfo(selectorAttrs: SubscriptionSelectorAttr): string | null {
		if (selectorAttrs.options.businessUse() && selectorAttrs.currentSubscriptionType && !selectorAttrs.currentlyBusinessOrdered) {
			const price = getSubscriptionPrice(selectorAttrs, selectorAttrs.currentSubscriptionType, UpgradePriceType.PlanActualPrice)
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

	private createFreeBuyOptionBoxAttr(selectorAttrs: SubscriptionSelectorAttr): BuyOptionBoxAttr {
		return {
			heading: "Free",
			actionButton:
				selectorAttrs.currentSubscriptionType === SubscriptionType.Free
					? getActiveSubscriptionActionButtonReplacement()
					: selectorAttrs.actionButtons.Free,
			price: formatPrice(0, true),
			helpLabel: "pricing.upgradeLater_msg",
			features: () => [
				lang.get("pricing.comparisonUsersFree_msg"),
				lang.get("pricing.comparisonStorage_msg", {
					"{amount}": 1,
				}),
				lang.get("pricing.comparisonDomainFree_msg"),
				lang.get("pricing.comparisonSearchFree_msg"),
				lang.get("pricing.comparisonOneCalendar_msg"),
			],
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: null,
			showReferenceDiscount: selectorAttrs.isInitialUpgrade,
		}
	}

	private createBuyOptionBoxAttr(selectorAttrs: SubscriptionSelectorAttr, targetSubscription: SubscriptionType): BuyOptionBoxAttr {
		const planPrices = getPlanPrices(selectorAttrs.planPrices, targetSubscription)

		if (!planPrices) {
			// no prices for the plan means subscription === SubscriptionType.Free (special case)
			return this.createFreeBuyOptionBoxAttr(selectorAttrs)
		}

		let showAdditionallyBookedFeatures = false

		if (selectorAttrs.currentSubscriptionType) {
			showAdditionallyBookedFeatures = !isDowngrade(targetSubscription, selectorAttrs.currentSubscriptionType)
		}

		const targetSubscriptionConfig = subscriptions[targetSubscription]
		const additionalUserPrice = getSubscriptionPrice(selectorAttrs, targetSubscription, UpgradePriceType.AdditionalUserPrice)
		const premiumFeatures = [
			lang.get("pricing.comparisonAddUser_msg", {
				"{1}": formatMonthlyPrice(additionalUserPrice, selectorAttrs.options.paymentInterval()),
			}),
			lang.get("pricing.comparisonStorage_msg", {
				"{amount}": planPrices.includedStorage,
			}),
			lang.get(
				targetSubscriptionConfig.business || (selectorAttrs.currentlyBusinessOrdered && showAdditionallyBookedFeatures)
					? "pricing.comparisonDomainBusiness_msg"
					: "pricing.comparisonDomainPremium_msg",
			),
			lang.get("pricing.comparisonSearchPremium_msg"),
			lang.get("pricing.comparisonMultipleCalendars_msg"),
			lang.get("pricing.mailAddressAliasesShort_label", {
				"{amount}": planPrices.includedAliases,
			}),
			lang.get("pricing.comparisonInboxRulesPremium_msg"),
			lang.get(targetSubscription === SubscriptionType.Pro ? "pricing.comparisonSupportPro_msg" : "pricing.comparisonSupportPremium_msg"),
		]
		const sharingFeature = [lang.get("pricing.comparisonSharingCalendar_msg")]
		const businessFeatures = [
			lang.get("pricing.comparisonOutOfOffice_msg"),
			lang.get("pricing.comparisonEventInvites_msg"),
			lang.get("pricing.businessTemplates_msg"),
		]
		const contactFormPrice = getSubscriptionPrice(selectorAttrs, targetSubscription, UpgradePriceType.ContactFormPrice)
		const whitelabelFeatures = [
			lang.get("pricing.comparisonLoginPro_msg"),
			lang.get("pricing.comparisonThemePro_msg"),
			lang.get("pricing.comparisonContactFormPro_msg", {
				"{price}": formatMonthlyPrice(contactFormPrice, selectorAttrs.options.paymentInterval()),
			}),
		]
		const featuresToBeOrdered = premiumFeatures
			.concat(targetSubscriptionConfig.business || (showAdditionallyBookedFeatures && selectorAttrs.currentlyBusinessOrdered) ? businessFeatures : [])
			.concat(targetSubscriptionConfig.sharing || (showAdditionallyBookedFeatures && selectorAttrs.currentlySharingOrdered) ? sharingFeature : [])
			.concat(
				targetSubscriptionConfig.whitelabel || (showAdditionallyBookedFeatures && selectorAttrs.currentlyWhitelabelOrdered) ? whitelabelFeatures : [],
			)
		// we only highlight the private Premium box if this is a signup or the current subscription type is Free
		const highlightPremium: boolean =
			targetSubscription === SubscriptionType.Premium &&
			!selectorAttrs.options.businessUse() &&
			(!selectorAttrs.currentSubscriptionType || selectorAttrs.currentSubscriptionType === SubscriptionType.Free)
		const subscriptionPrice = getSubscriptionPrice(selectorAttrs, targetSubscription, UpgradePriceType.PlanActualPrice)
		const formattedMonthlyPrice = formatMonthlyPrice(subscriptionPrice, selectorAttrs.options.paymentInterval())
		return {
			heading: getDisplayNameOfSubscriptionType(targetSubscription),
			actionButton:
				selectorAttrs.currentSubscriptionType === targetSubscription
					? getActiveSubscriptionActionButtonReplacement()
					: getActionButtonBySubscription(selectorAttrs.actionButtons, targetSubscription),
			price: formattedMonthlyPrice,
			priceHint: getPriceHint(subscriptionPrice, selectorAttrs.options.paymentInterval()),
			helpLabel: selectorAttrs.options.businessUse() ? "pricing.basePriceExcludesTaxes_msg" : "pricing.basePriceIncludesTaxes_msg",
			features: () => featuresToBeOrdered,
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: selectorAttrs.isInitialUpgrade ? selectorAttrs.options.paymentInterval : null,
			highlighted: highlightPremium,
			showReferenceDiscount: selectorAttrs.isInitialUpgrade,
		}
	}
}

function getPriceHint(subscriptionPrice: number, paymentInterval: number): TranslationKey {
	if (subscriptionPrice > 0) {
		return isYearlyPayment(paymentInterval) ? "pricing.perMonthPaidYearly_label" : "pricing.perMonth_label"
	} else {
		return "emptyString_msg"
	}
}