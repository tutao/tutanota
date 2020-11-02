//@flow
import m from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {BuyOptionBoxAttr} from "./BuyOptionBox"
import {BOX_MARGIN, BuyOptionBox, getActiveSubscriptionActionButtonReplacement} from "./BuyOptionBox"
import type {SubscriptionOptions, SubscriptionTypeEnum} from "./SubscriptionUtils"
import {BusinessUseItems, formatPrice, getFormattedUpgradePrice, SubscriptionType, UpgradePriceType} from "./SubscriptionUtils"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {PlanPrices} from "../api/entities/sys/PlanPrices"

export type SubscriptionSelectorAttr = {|
	options: SubscriptionOptions,
	campaignInfoTextId: ?TranslationKey,
	freeActionButton: Component,
	premiumActionButton: Component,
	teamsActionButton: Component,
	proActionButton: Component,
	boxWidth: number,
	boxHeight: number,
	highlightPremium?: boolean,
	currentlyActive?: ?SubscriptionTypeEnum,
	currentlySharingOrdered: boolean,
	currentlyWhitelabelOrdered: boolean,
	isInitialUpgrade: boolean,
	premiumPrices: PlanPrices,
	teamsPrices: PlanPrices,
	proPrices: PlanPrices,
|}

export class SubscriptionSelector implements MComponent<SubscriptionSelectorAttr> {
	_containerDOM: ?Element;

	view(vnode: Vnode<SubscriptionSelectorAttr>): Children {
		let buyBoxesViewPlacement
		if (vnode.attrs.options.businessUse()) {
			buyBoxesViewPlacement = [
				m(BuyOptionBox, this._createPremiumUpgradeBoxAttr(vnode.attrs)),
				m(BuyOptionBox, this._createTeamsUpgradeBoxAttr(vnode.attrs)),
				m(BuyOptionBox, this._createProUpgradeBoxAttr(vnode.attrs)),
				m(".smaller.mb", lang.get("downgradeToPrivateNotAllowed_msg")) //only displayed when business options are shown
			]
		} else {
			// Add BuyOptionBox margin twice to the boxWidth received
			const columnWidth = vnode.attrs.boxWidth + (BOX_MARGIN * 2);
			// Changes order of BuyBoxes to Premium Pro Free, needed for mobile view (one column layout)
			if (this._containerDOM && this._containerDOM.clientWidth < columnWidth * 2) {
				buyBoxesViewPlacement = [
					m(BuyOptionBox, this._createPremiumUpgradeBoxAttr(vnode.attrs)),
					m(BuyOptionBox, this._createTeamsUpgradeBoxAttr(vnode.attrs)),
					m(BuyOptionBox, this._createFreeUpgradeBoxAttr(vnode.attrs))
				]
			} else {
				buyBoxesViewPlacement = [
					m(BuyOptionBox, this._createFreeUpgradeBoxAttr(vnode.attrs)),
					m(BuyOptionBox, this._createPremiumUpgradeBoxAttr(vnode.attrs)),
					m(BuyOptionBox, this._createTeamsUpgradeBoxAttr(vnode.attrs))
				]
			}
		}
		return [
			vnode.attrs.isInitialUpgrade ? m(SegmentControl, {
				selectedValue: vnode.attrs.options.businessUse,
				items: BusinessUseItems
			}) : null,
			vnode.attrs.campaignInfoTextId
			&& lang.exists(vnode.attrs.campaignInfoTextId) ? m(".b.center.mt", lang.get(vnode.attrs.campaignInfoTextId)) : null,
			m(".flex.center-horizontally.wrap", {
					oncreate: (vnode) => {
						this._containerDOM = vnode.dom;
						m.redraw();
					},
				},
				buyBoxesViewPlacement)
		]
	}

	_createFreeUpgradeBoxAttr(selectorAttrs: SubscriptionSelectorAttr): BuyOptionBoxAttr {
		return {
			heading: 'Free',
			actionButton: selectorAttrs.currentlyActive === SubscriptionType.Free
				? getActiveSubscriptionActionButtonReplacement()
				: selectorAttrs.freeActionButton,
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

	_createPremiumUpgradeBoxAttr(selectorAttrs: SubscriptionSelectorAttr): BuyOptionBoxAttr {
		let sharingFeatureArray = (selectorAttrs.currentlyActive === SubscriptionType.Premium
			&& selectorAttrs.currentlySharingOrdered) ? [lang.get("pricing.comparisonSharingCalendar_msg")] : []
		let whitelabelFeatureArray = (selectorAttrs.currentlyActive === SubscriptionType.Premium
			&& selectorAttrs.currentlyWhitelabelOrdered) ? [
			lang.get("pricing.comparisonLoginPro_msg"),
			lang.get("pricing.comparisonThemePro_msg"),
			lang.get("pricing.comparisonContactFormPro_msg", {"{price}": getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Pro, UpgradePriceType.ContactFormPrice)})
		] : []
		return {
			heading: 'Premium',
			actionButton: selectorAttrs.currentlyActive === SubscriptionType.Premium
				? getActiveSubscriptionActionButtonReplacement()
				: selectorAttrs.premiumActionButton,
			price: getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice),
			originalPrice: getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice),
			helpLabel: selectorAttrs.options.businessUse() ? "pricing.basePriceExcludesTaxes_msg" : "pricing.basePriceIncludesTaxes_msg",
			features: () => [
				lang.get("pricing.comparisonAddUser_msg", {"{1}": getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)}),
				lang.get("pricing.comparisonStorage_msg", {"{amount}": selectorAttrs.premiumPrices.includedStorage}),
				lang.get("pricing.comparisonDomainPremium_msg"),
				lang.get("pricing.comparisonSearchPremium_msg"),
				lang.get("pricing.comparisonMultipleCalendars_msg"),
				lang.get("pricing.mailAddressAliasesShort_label", {"{amount}": selectorAttrs.premiumPrices.includedAliases}),
				lang.get("pricing.comparisonInboxRulesPremium_msg"),
				lang.get("pricing.comparisonSupportPremium_msg"),
			].concat(sharingFeatureArray).concat(whitelabelFeatureArray),
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: selectorAttrs.isInitialUpgrade ? selectorAttrs.options.paymentInterval : null,
			highlighted: !selectorAttrs.options.businessUse() && selectorAttrs.highlightPremium,
			showReferenceDiscount: selectorAttrs.isInitialUpgrade
		}
	}


	_createTeamsUpgradeBoxAttr(selectorAttrs: SubscriptionSelectorAttr): BuyOptionBoxAttr {
		let whitelabelFeatureArray = ((selectorAttrs.currentlyActive === SubscriptionType.Premium
			|| selectorAttrs.currentlyActive === SubscriptionType.Teams)
			&& selectorAttrs.currentlyWhitelabelOrdered) ? [
			lang.get("pricing.comparisonLoginPro_msg"),
			lang.get("pricing.comparisonThemePro_msg"),
			lang.get("pricing.comparisonContactFormPro_msg", {"{price}": getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Pro, UpgradePriceType.ContactFormPrice)})
		] : []
		return {
			heading: 'Teams',
			actionButton: selectorAttrs.currentlyActive === SubscriptionType.Teams
				? getActiveSubscriptionActionButtonReplacement()
				: selectorAttrs.teamsActionButton,
			price: getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Teams, UpgradePriceType.PlanActualPrice),
			originalPrice: getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Teams, UpgradePriceType.PlanReferencePrice),
			helpLabel: selectorAttrs.options.businessUse() ? "pricing.basePriceExcludesTaxes_msg" : "pricing.basePriceIncludesTaxes_msg",
			features: () => [
				lang.get("pricing.comparisonAddUser_msg", {"{1}": getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Teams, UpgradePriceType.AdditionalUserPrice)}),
				lang.get("pricing.comparisonStorage_msg", {"{amount}": selectorAttrs.teamsPrices.includedStorage}),
				lang.get("pricing.comparisonDomainPremium_msg"),
				lang.get("pricing.comparisonSearchPremium_msg"),
				lang.get("pricing.comparisonMultipleCalendars_msg"),
				lang.get("pricing.mailAddressAliasesShort_label", {"{amount}": selectorAttrs.teamsPrices.includedAliases}),
				lang.get("pricing.comparisonInboxRulesPremium_msg"),
				lang.get("pricing.comparisonSupportPremium_msg"),
				lang.get("pricing.comparisonSharingCalendar_msg"),
			].concat(whitelabelFeatureArray),
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: selectorAttrs.isInitialUpgrade ? selectorAttrs.options.paymentInterval : null,
			showReferenceDiscount: selectorAttrs.isInitialUpgrade
		}
	}

	_createProUpgradeBoxAttr(selectorAttrs: SubscriptionSelectorAttr): BuyOptionBoxAttr {
		return {
			heading: 'Pro',
			actionButton: selectorAttrs.currentlyActive === SubscriptionType.Pro
				? getActiveSubscriptionActionButtonReplacement()
				: selectorAttrs.proActionButton,
			price: getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Pro, UpgradePriceType.PlanActualPrice),
			originalPrice: getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Pro, UpgradePriceType.PlanReferencePrice),
			helpLabel: selectorAttrs.options.businessUse() ? "pricing.basePriceExcludesTaxes_msg" : "pricing.basePriceIncludesTaxes_msg",
			features: () => [
				lang.get("pricing.comparisonAddUser_msg", {"{1}": getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Pro, UpgradePriceType.AdditionalUserPrice)}),
				lang.get("pricing.comparisonStorage_msg", {"{amount}": selectorAttrs.proPrices.includedStorage}),
				lang.get("pricing.comparisonDomainPremium_msg"),
				lang.get("pricing.comparisonSearchPremium_msg"),
				lang.get("pricing.comparisonMultipleCalendars_msg"),
				lang.get("pricing.mailAddressAliasesShort_label", {"{amount}": selectorAttrs.proPrices.includedAliases}),
				lang.get("pricing.comparisonInboxRulesPremium_msg"),
				lang.get("pricing.comparisonSupportPro_msg"),
				lang.get("pricing.comparisonSharingCalendar_msg"),
				lang.get("pricing.comparisonLoginPro_msg"),
				lang.get("pricing.comparisonThemePro_msg"),
				lang.get("pricing.comparisonContactFormPro_msg", {"{price}": getFormattedUpgradePrice(selectorAttrs, SubscriptionType.Pro, UpgradePriceType.ContactFormPrice)}),
			],
			width: selectorAttrs.boxWidth,
			height: selectorAttrs.boxHeight,
			paymentInterval: selectorAttrs.isInitialUpgrade ? selectorAttrs.options.paymentInterval : null,
			showReferenceDiscount: selectorAttrs.isInitialUpgrade
		}
	}
}
