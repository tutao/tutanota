//@flow
import m from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {BuyOptionBoxAttr} from "./BuyOptionBox"
import {BOX_MARGIN, BuyOptionBox, getActiveSubscriptionActionButtonReplacement} from "./BuyOptionBox"
import type {SubscriptionActionButtons, SubscriptionOptions, SubscriptionPlanPrices, SubscriptionTypeEnum} from "./SubscriptionUtils"
import {
	getActionButtonBySubscription,
	getDisplayNameOfSubscriptionType,
	getPlanPrices,
	isDowngrade,
	subscriptions,
	SubscriptionType,
	UpgradePriceType
} from "./SubscriptionUtils"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import {formatPrice, getFormattedSubscriptionPrice} from "./PriceUtils"

const BusinessUseItems: SegmentControlItem<boolean>[] = [
	{name: lang.get("pricing.privateUse_label"), value: false},
	{name: lang.get("pricing.businessUse_label"), value: true}
]

export type SubscriptionSelectorAttr = {|
	options: SubscriptionOptions,
	campaignInfoTextId: ?TranslationKey,
	actionButtons: SubscriptionActionButtons,
	boxWidth: number,
	boxHeight: number,
	currentSubscriptionType?: ?SubscriptionTypeEnum,
	currentlySharingOrdered: boolean,
	currentlyBusinessOrdered: boolean,
	currentlyWhitelabelOrdered: boolean,
	orderedContactForms: number,
	isInitialUpgrade: boolean,
	planPrices: SubscriptionPlanPrices
|}

export class SubscriptionSelector implements MComponent<SubscriptionSelectorAttr> {
	_containerDOM: ?Element;

	view(vnode: Vnode<SubscriptionSelectorAttr>): Children {
		let buyBoxesViewPlacement
		if (vnode.attrs.options.businessUse()) {
			buyBoxesViewPlacement = [
				m(BuyOptionBox, this._createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.PremiumBusiness)),
				m(BuyOptionBox, this._createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.TeamsBusiness)),
				m(BuyOptionBox, this._createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Pro)),
				m(".smaller.mb", lang.get("downgradeToPrivateNotAllowed_msg")) //only displayed when business options are shown
			]
		} else {
			const currentSubscription = vnode.attrs.currentSubscriptionType
			// Add BuyOptionBox margin twice to the boxWidth received
			const columnWidth = vnode.attrs.boxWidth + (BOX_MARGIN * 2);
			const premiumBuyOptionBox = m(BuyOptionBox, currentSubscription === SubscriptionType.PremiumBusiness
				? this._createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.PremiumBusiness)
				: this._createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Premium))
			const teamsBuyOptionBox = m(BuyOptionBox, currentSubscription === SubscriptionType.TeamsBusiness
				? this._createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.TeamsBusiness)
				: this._createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Teams))
			const freeBuyOptionBox = m(BuyOptionBox, this._createBuyOptionBoxAttr(vnode.attrs, SubscriptionType.Free))
			// Changes order of BuyBoxes to Premium Pro Free, needed for mobile view (one column layout)
			if (this._containerDOM && this._containerDOM.clientWidth < columnWidth * 2) {
				buyBoxesViewPlacement = [premiumBuyOptionBox, teamsBuyOptionBox, freeBuyOptionBox]
			} else {
				buyBoxesViewPlacement = [freeBuyOptionBox, premiumBuyOptionBox, teamsBuyOptionBox]
			}
		}
		const currentPlanInfo = this._getCurrentPlanInfo(vnode.attrs)
		return [
			vnode.attrs.isInitialUpgrade ? m(SegmentControl, {
				selectedValue: vnode.attrs.options.businessUse,
				items: BusinessUseItems
			}) : null,
			vnode.attrs.campaignInfoTextId
			&& lang.exists(vnode.attrs.campaignInfoTextId) ? m(".b.center.mt", lang.get(vnode.attrs.campaignInfoTextId)) : null,
			currentPlanInfo ? m(".smaller.center.mt", currentPlanInfo) : null,
			m(".flex.center-horizontally.wrap", {
					oncreate: (vnode) => {
						this._containerDOM = vnode.dom;
						m.redraw();
					},
				},
				buyBoxesViewPlacement)
		]
	}

	_getCurrentPlanInfo(selectorAttrs: SubscriptionSelectorAttr): ?string {
		if (selectorAttrs.options.businessUse() && selectorAttrs.currentSubscriptionType && !selectorAttrs.currentlyBusinessOrdered) {
			const price = getFormattedSubscriptionPrice(selectorAttrs, selectorAttrs.currentSubscriptionType, UpgradePriceType.PlanActualPrice)
			return lang.get("businessCustomerNeedsBusinessFeaturePlan_msg", {
					"{price}": price,
					"{plan}": selectorAttrs.currentSubscriptionType
				})
				+ " " + lang.get("businessCustomerAutoBusinessFeature_msg")
		}
		return null
	}

	_createFreeBuyOptionBoxAttr(selectorAttrs: SubscriptionSelectorAttr): BuyOptionBoxAttr {
		return {
			heading: 'Free',
			actionButton: selectorAttrs.currentSubscriptionType === SubscriptionType.Free
				? getActiveSubscriptionActionButtonReplacement()
				: selectorAttrs.actionButtons.Free,
			price: formatPrice(0, true),
			originalPrice: formatPrice(0, true),
			helpLabel: "pricing.upgradeLater_msg",
			features: () => [
				lang.get("pricing.comparisonUsersFree_msg"),
				lang.get("pricing.comparisonStorage_msg", {"{amount}": 1}),
				lang.get("pricing.comparisonDomainFree_msg"),
				lang.get("pricing.comparisonSearchFree_msg"),
				lang.get("pricing.comparisonOneCalendar_msg"),
			],
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: null,
			showReferenceDiscount: selectorAttrs.isInitialUpgrade
		}
	}

	_createBuyOptionBoxAttr(selectorAttrs: SubscriptionSelectorAttr, targetSubscription: SubscriptionTypeEnum): BuyOptionBoxAttr {
		const planPrices = getPlanPrices(selectorAttrs.planPrices, targetSubscription)
		if (!planPrices) { // no prices for the plan means subscription === SubscriptionType.Free (special case)
			return this._createFreeBuyOptionBoxAttr(selectorAttrs)
		}
		let showAdditionallyBookedFeatures = false
		if (selectorAttrs.currentSubscriptionType) {
			showAdditionallyBookedFeatures = !isDowngrade(targetSubscription, selectorAttrs.currentSubscriptionType)
		}
		const targetSubscriptionConfig = subscriptions[targetSubscription]

		const premiumFeatures = [
			lang.get("pricing.comparisonAddUser_msg", {"{1}": getFormattedSubscriptionPrice(selectorAttrs, targetSubscription, UpgradePriceType.AdditionalUserPrice)}),
			lang.get("pricing.comparisonStorage_msg", {"{amount}": planPrices.includedStorage}),
			lang.get(targetSubscriptionConfig.business || (selectorAttrs.currentlyBusinessOrdered && showAdditionallyBookedFeatures)
				? "pricing.comparisonDomainBusiness_msg"
				: "pricing.comparisonDomainPremium_msg"),
			lang.get("pricing.comparisonSearchPremium_msg"),
			lang.get("pricing.comparisonMultipleCalendars_msg"),
			lang.get("pricing.mailAddressAliasesShort_label", {"{amount}": planPrices.includedAliases}),
			lang.get("pricing.comparisonInboxRulesPremium_msg"),
			lang.get(targetSubscription === SubscriptionType.Pro
				? "pricing.comparisonSupportPro_msg"
				: "pricing.comparisonSupportPremium_msg")
		]
		const sharingFeature = [lang.get("pricing.comparisonSharingCalendar_msg")]
		const businessFeatures = [
			lang.get("pricing.comparisonOutOfOffice_msg"),
			lang.get("pricing.comparisonEventInvites_msg")
		]
		const whitelabelFeatures = [
			lang.get("pricing.comparisonLoginPro_msg"),
			lang.get("pricing.comparisonThemePro_msg"),
			lang.get("pricing.comparisonContactFormPro_msg", {"{price}": getFormattedSubscriptionPrice(selectorAttrs, targetSubscription, UpgradePriceType.ContactFormPrice)})
		]
		const featuresToBeOrdered = premiumFeatures
			.concat(targetSubscriptionConfig.business || (showAdditionallyBookedFeatures
				&& selectorAttrs.currentlyBusinessOrdered) ? businessFeatures : [])
			.concat(targetSubscriptionConfig.sharing || (showAdditionallyBookedFeatures
				&& selectorAttrs.currentlySharingOrdered) ? sharingFeature : [])
			.concat(targetSubscriptionConfig.whitelabel || (showAdditionallyBookedFeatures
				&& selectorAttrs.currentlyWhitelabelOrdered) ? whitelabelFeatures : [])

		// we only highlight the private Premium box if this is a signup or the current subscription type is Free
		const highlightPremium: boolean = targetSubscription === SubscriptionType.Premium
			&& !selectorAttrs.options.businessUse()
			&& (!selectorAttrs.currentSubscriptionType || selectorAttrs.currentSubscriptionType === SubscriptionType.Free)

		return {
			heading: getDisplayNameOfSubscriptionType(targetSubscription),
			actionButton: selectorAttrs.currentSubscriptionType === targetSubscription
				? getActiveSubscriptionActionButtonReplacement()
				: getActionButtonBySubscription(selectorAttrs.actionButtons, targetSubscription),
			price: getFormattedSubscriptionPrice(selectorAttrs, targetSubscription, UpgradePriceType.PlanActualPrice),
			originalPrice: getFormattedSubscriptionPrice(selectorAttrs, targetSubscription, UpgradePriceType.PlanReferencePrice),
			helpLabel: selectorAttrs.options.businessUse() ? "pricing.basePriceExcludesTaxes_msg" : "pricing.basePriceIncludesTaxes_msg",
			features: () => featuresToBeOrdered,
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: selectorAttrs.isInitialUpgrade ? selectorAttrs.options.paymentInterval : null,
			highlighted: highlightPremium,
			showReferenceDiscount: selectorAttrs.isInitialUpgrade
		}
	}
}
