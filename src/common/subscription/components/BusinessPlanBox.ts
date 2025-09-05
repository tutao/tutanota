import m, { Children, Component, Vnode } from "mithril"
import { px, size } from "../../gui/size"
import { PlanType, PlanTypeToName } from "../../api/common/TutanotaConstants"
import { Theme, theme } from "../../gui/theme"
import { PaymentInterval, PriceAndConfigProvider } from "../utils/PriceUtils"
import { TranslationKeyType } from "../../misc/TranslationKey"
import { Icons } from "../../gui/base/icons/Icons"
import { ReplacementKey } from "../FeatureListProvider"
import { Icon, IconSize } from "../../gui/base/Icon"
import { lang } from "../../misc/LanguageViewModel"
import { getFeaturePlaceholderReplacement } from "../utils/SubscriptionUtils"
import { PlanConfig } from "./BusinessPlanContainer"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import { styles } from "../../gui/styles"
import { boxShadowHigh } from "../../gui/main-styles"
import { PlanBadge } from "./PlanBadge"
import { DiscountDetail, getHasCampaign } from "../utils/PlanSelectorUtils"
import { PromotionRibbon } from "./PromotionRibbon"
import Stream from "mithril/stream"

type BusinessPlanBoxAttrs = {
	planConfig: PlanConfig
	price: string
	referencePrice?: string
	isSelected: boolean
	isDisabled: boolean
	isCurrentPlan: boolean
	onclick: (plan: PlanType) => void
	priceAndConfigProvider: PriceAndConfigProvider
	discountDetail?: DiscountDetail
	selectedPaymentInterval: Stream<PaymentInterval>
}

export class BusinessPlanBox implements Component<BusinessPlanBoxAttrs> {
	private contentEl?: HTMLElement
	private collapsedH = 0
	private prevSelected?: boolean

	private measureCollapsed() {
		const root = this.contentEl
		if (!root) return
		const rows = root.querySelectorAll<HTMLElement>(".feature-row")
		if (rows.length === 0) return

		if (rows.length === 1) {
			this.collapsedH = rows[0].offsetHeight
		} else {
			const first = rows[0],
				second = rows[1]
			this.collapsedH = second.offsetTop - first.offsetTop + second.offsetHeight
		}
	}

	private setMaxHeight(selected: boolean) {
		if (!this.contentEl) return
		const target = selected ? this.contentEl.scrollHeight : this.collapsedH
		this.contentEl.style.maxHeight = px(target)
	}

	private animateTo(selected: boolean) {
		if (!this.contentEl) return

		const el = this.contentEl
		const start = selected ? this.collapsedH : el.scrollHeight
		const end = selected ? el.scrollHeight : this.collapsedH

		el.style.maxHeight = px(start)
		void el.getBoundingClientRect()
		el.style.maxHeight = px(end)

		const done = () => {
			el.removeEventListener("transitionend", done)
			m.redraw()
		}
		el.addEventListener("transitionend", done)
	}

	view({ attrs }: Vnode<BusinessPlanBoxAttrs>): Children {
		const localTheme = theme
		const renderFeature = this.generateRenderFeature(attrs.planConfig.type, attrs.priceAndConfigProvider, localTheme)
		const { selectedPaymentInterval, planConfig, price, referencePrice, isSelected, isDisabled, isCurrentPlan, onclick, discountDetail } = attrs

		const isYearly = selectedPaymentInterval() === PaymentInterval.Yearly
		const hasCampaign = getHasCampaign(discountDetail, isYearly)
		const handleSelect = (event: Event) => {
			if (event instanceof KeyboardEvent && ![" ", "Enter"].includes((event as KeyboardEvent).key)) return
			return !isDisabled && onclick(planConfig.type)
		}

		return m(
			"div.flex.flex-column",
			{
				style: {
					transform: isSelected && !styles.isMobileLayout() ? `translateY(${px(-size.core_16)})` : "initial",
					transition: `transform ${DefaultAnimationTime}ms, box-shadow ${DefaultAnimationTime}ms, background-color ${DefaultAnimationTime}ms`,
				},
				onclick: handleSelect,
				onkeydown: handleSelect,
				role: "button",
				"aria-pressed": String(isSelected),
				"aria-disabled": String(isDisabled),
				tabindex: isDisabled ? -1 : 0,
			},
			hasCampaign &&
				m(PromotionRibbon, {
					planBoxPosition: "center",
					translation: attrs.discountDetail!.ribbonTranslation,
				}),
			m(
				"div",
				{
					oncreate: () => {
						this.measureCollapsed()
					},
					onupdate: () => {
						this.measureCollapsed()
					},
					style: {
						cursor: isDisabled ? "not-allowed" : "pointer",
						userSelect: "none",
						borderStyle: "solid",
						borderWidth: hasCampaign ? `0 ${px(2)} ${px(2)} ${px(2)}` : px(2),
						borderColor: isSelected ? localTheme.primary : localTheme.outline_variant,
						backgroundColor: isSelected ? localTheme.surface_container_high : localTheme.surface,
						borderRadius: hasCampaign ? `0 0 ${px(12)} ${px(12)}` : px(12),
						padding: `${px(styles.isMobileLayout() ? 12 : size.spacing_24)} ${px(styles.isMobileLayout() ? 12 : size.spacing_24)}`,
						opacity: isDisabled ? 0.6 : 1,
						"box-shadow": isSelected ? boxShadowHigh : "initial",
						height: "100%",
					},
				},
				[
					// header
					m(`div.flex.items-center.justify-between.gap-16${styles.isMobileLayout() ? ".flex" : ".flex-column"}`, [
						m(`${styles.isMobileLayout() ? ".flex.gap-12.items-center" : ".flex.flex-column.gap-8"}`, [
							m(`div.items-center.justify-center.flex.gap-12`, [
								m(Icon, {
									icon: planConfig.icon,
									size: IconSize.PX24,
									style: {
										fill: theme.on_surface_variant,
									},
								}),
								m(Icon, {
									icon: Icons.ChevronDown,
									class: `flex-center items-center`,
									size: IconSize.PX20,
									style: {
										display: styles.isMobileLayout() ? "block" : "none",
										margin: "-3px",
										transform: `rotateZ(${attrs.isSelected ? 180 : 0}deg)`,
										transition: `transform ${DefaultAnimationTime}ms`,
										color: theme.on_surface_variant,
									},
								}),
							]),
							m(`div.flex-grow${styles.isMobileLayout() ? ".left" : ".center"}`, [
								m(
									"div.font-mdio",
									{
										style: {
											lineHeight: 1,
											fontWeight: "bold",
											fontSize: px(styles.isMobileLayout() ? 18 : 20),
											color: isSelected ? localTheme.primary : localTheme.on_surface,
										},
									},
									PlanTypeToName[planConfig.type],
								),
								m(
									"div",
									{
										style: {
											display: styles.isMobileLayout() ? "none" : "block",
											fontSize: px(12),
										},
									},
									lang.getTranslationText(planConfig.tagLine),
								),
							]),
						]),
						m(
							".flex.justify-center.items-center",
							{ style: { minHeight: px(50) } },
							isCurrentPlan || isDisabled
								? m(PlanBadge, { langKey: isCurrentPlan ? "pricing.currentPlan_label" : "unavailable_label" })
								: m(`div.no-wrap${styles.isMobileLayout() ? ".right" : ".center"}`, [
										m("div.lh-s", [
											referencePrice
												? m("span.strike.mr-8.smaller", { style: { color: localTheme.on_surface_variant } }, referencePrice)
												: null,
											m("span.h1", price),
										]),
										m(
											"div.small",
											{ style: { color: localTheme.on_surface_variant } },
											lang.getTranslationText("pricing.perUserMonth_label"),
										),
									]),
						),
					]),

					m("hr", {
						style: {
							margin: styles.isMobileLayout() ? "8px 0" : "16px 0",
							height: px(1),
							display: "block",
							border: "none",
							backgroundColor: localTheme.outline_variant,
						},
					}),
					// features
					m(
						"div.features-wrap",
						{
							oncreate: (v) => {
								this.contentEl = v.dom as HTMLElement
								this.measureCollapsed()
								if (styles.isMobileLayout()) {
									this.setMaxHeight(attrs.isSelected)
								} else {
									this.setMaxHeight(true)
								}
							},
							onupdate: (v) => {
								this.contentEl = v.dom as HTMLElement
								this.measureCollapsed()
								if (this.prevSelected !== attrs.isSelected && styles.isMobileLayout()) {
									this.animateTo(attrs.isSelected)
								} else {
									if (styles.isMobileLayout()) {
										this.setMaxHeight(attrs.isSelected)
									} else {
										this.setMaxHeight(true)
									}
								}
								this.prevSelected = attrs.isSelected
							},
							style: {
								overflow: "hidden",
								transition: `max-height ${DefaultAnimationTime}ms ease`,
								willChange: "max-height",
								marginTop: "12px",
							},
						},
						m(
							".flex.flex-column.gap-8",
							planConfig.features.map((feature) => renderFeature(feature.label, feature.icon, feature.replacementKey)),
						),
					),
				],
			),
		)
	}

	private generateRenderFeature(planType: PlanType, provider: PriceAndConfigProvider, theme: Theme) {
		return (langKey: TranslationKeyType, icon: Icons, replacement?: ReplacementKey) => {
			return m(
				".flex.feature-row",
				{
					style: {
						gap: px(size.base_4),
					},
				},
				m(Icon, {
					icon,
					style: {
						fill: theme.secondary,
					},
				}),
				m(".smaller", lang.getTranslation(langKey, getFeaturePlaceholderReplacement(replacement, planType, provider)).text),
			)
		}
	}
}
