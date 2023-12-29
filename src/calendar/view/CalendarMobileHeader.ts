import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../gui/base/IconButton.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { BaseMobileHeader } from "../../gui/BaseMobileHeader.js"
import { OfflineIndicatorMobile } from "../../gui/base/OfflineIndicator.js"
import { ProgressBar } from "../../gui/base/ProgressBar.js"
import { Icons, IconsSvg } from "../../gui/base/icons/Icons.js"
import { CalendarNavConfiguration, CalendarViewType, getIconForViewType } from "../gui/CalendarGuiUtils.js"
import { MobileHeaderMenuButton, MobileHeaderTitle } from "../../gui/MobileHeader.js"
import { AppHeaderAttrs } from "../../gui/Header.js"
import { attachDropdown } from "../../gui/base/Dropdown.js"
import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { styles } from "../../gui/styles.js"
import { Icon } from "../../gui/base/Icon.js"
import { theme } from "../../gui/theme.js"
import { ClickHandler } from "../../gui/base/GuiUtils.js"
import { assertNotNull, memoized } from "@tutao/tutanota-utils"

export interface CalendarMobileHeaderAttrs extends AppHeaderAttrs {
	viewType: CalendarViewType
	viewSlider: ViewSlider
	navConfiguration: CalendarNavConfiguration
	onCreateEvent: () => unknown
	onToday: () => unknown
	onViewTypeSelected: (viewType: CalendarViewType) => unknown
	onTap?: ClickHandler
	showExpandIcon: boolean
	isDaySelectorExpanded: boolean
}

/**
 * A special header that is used instead of {@link MobileHeader} but just for calendar.
 */
export class CalendarMobileHeader implements Component<CalendarMobileHeaderAttrs> {
	view({ attrs }: Vnode<CalendarMobileHeaderAttrs>): Children {
		return m(BaseMobileHeader, {
			left: m(MobileHeaderMenuButton, { newsModel: attrs.newsModel, backAction: () => attrs.viewSlider.focusPreviousColumn() }),
			center: m(MobileHeaderTitle, {
				title: attrs.showExpandIcon
					? m(
							".flex.items-center",
							{
								"aria-expanded": `${attrs.isDaySelectorExpanded}`,
								role: "button",
							},
							[
								attrs.navConfiguration.title,
								m(Icon, {
									icon: BootIcons.Expand,
									large: true,
									style: {
										fill: theme.content_fg,
										transform: attrs.isDaySelectorExpanded ? "rotate(180deg)" : "",
									},
								}),
							],
					  )
					: attrs.navConfiguration.title,
				bottom: m(OfflineIndicatorMobile, attrs.offlineIndicatorModel.getCurrentAttrs()),
				onTap: attrs.onTap,
			}),
			right: [
				...(styles.isDesktopLayout() || styles.isTwoColumnLayout() ? [attrs.navConfiguration.back, attrs.navConfiguration.forward] : []),
				m(TodayIconButton, {
					click: attrs.onToday,
				}),
				this.renderViewSelector(attrs),
				m(IconButton, {
					icon: Icons.Add,
					title: "createEvent_label",
					click: attrs.onCreateEvent,
				}),
			],
			injections: m(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }),
		})
	}

	private renderViewSelector(attrs: CalendarMobileHeaderAttrs): Children {
		return m(
			IconButton,
			attachDropdown({
				mainButtonAttrs: {
					icon: getIconForViewType(attrs.viewType),
					title: "view_label",
				},
				childAttrs: () => {
					const calendarViewValues: Array<{ name: TranslationKey; value: CalendarViewType }> = [
						{
							name: "agenda_label",
							value: CalendarViewType.AGENDA,
						},
						{
							name: "day_label",
							value: CalendarViewType.DAY,
						},
						{
							name: "week_label",
							value: CalendarViewType.WEEK,
						},
						{
							name: "month_label",
							value: CalendarViewType.MONTH,
						},
					]

					return calendarViewValues.map(({ name, value }) => ({
						label: name,
						selected: value === attrs.viewType,
						icon: getIconForViewType(value),
						click: () => attrs.onViewTypeSelected(value),
					}))
				},
			}),
		)
	}
}

export interface TodayIconButtonAttrs {
	click: ClickHandler
}

/**
 * Button that has a current day number displayed in it.
 *
 * Implemented as a custom class because we need to manipulate the icon directly
 */
export class TodayIconButton implements Component<TodayIconButtonAttrs> {
	private dom: HTMLElement | null = null

	view(vnode: Vnode<TodayIconButtonAttrs>): Children {
		const { attrs } = vnode
		const icon = this.getIcon(new Date().getDate())
		return m(
			"button.icon-button.state-bg",
			{
				oncreate: ({ dom }) => {
					this.dom = dom as HTMLElement
				},
				onclick: (e: MouseEvent) => {
					attrs.click(e, assertNotNull(this.dom))
					// It doesn't make sense to propagate click events if we are the button
					e.stopPropagation()
				},
				title: lang.get("today_label"),
			},
			m(
				".icon.icon-large.center-h.svg-text-content-bg",
				{
					style: {
						fill: theme.content_button,
					},
				},
				m.trust(icon),
			),
		)
	}

	private getIcon = memoized((dayNumber: number) => {
		return IconsSvg.Today.replace("{date}", dayNumber.toString())
	})
}
