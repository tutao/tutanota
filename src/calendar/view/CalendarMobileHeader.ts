import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../gui/base/IconButton.js"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { BaseMobileHeader } from "../../gui/BaseMobileHeader.js"
import { OfflineIndicator } from "../../gui/base/OfflineIndicator.js"
import { ProgressBar } from "../../gui/base/ProgressBar.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { CalendarNavConfiguration, CalendarViewType, getIconForViewType } from "../gui/CalendarGuiUtils.js"
import { MobileHeaderMenuButton, MobileHeaderTitle } from "../../gui/MobileHeader.js"
import { AppHeaderAttrs } from "../../gui/Header.js"
import { attachDropdown } from "../../gui/base/Dropdown.js"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { styles } from "../../gui/styles.js"
import { theme } from "../../gui/theme.js"
import { ClickHandler } from "../../gui/base/GuiUtils.js"
import { TodayIconButton } from "./TodayIconButton.js"
import { ExpanderButton } from "../../gui/base/Expander.js"
import { isApp } from "../../api/common/Env.js"

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
					? m(ExpanderButton, {
							label: () => attrs.navConfiguration.title,
							isUnformattedLabel: true,
							style: {
								"padding-top": "inherit",
								height: "inherit",
								"min-height": "inherit",
								"text-decoration": "none",
							},
							expanded: attrs.isDaySelectorExpanded,
							color: theme.content_fg,
							isBig: true,
							isPropagatingEvents: true,
							onExpandedChange: () => {},
					  })
					: attrs.navConfiguration.title,
				bottom: m(OfflineIndicator, attrs.offlineIndicatorModel.getCurrentAttrs()),
				onTap: attrs.onTap,
			}),
			right: [
				...(!isApp() && (styles.isSingleColumnLayout() || styles.isTwoColumnLayout())
					? [attrs.navConfiguration.back, attrs.navConfiguration.forward]
					: []),
				m(TodayIconButton, {
					click: attrs.onToday,
				}),
				this.renderViewSelector(attrs),
				m(IconButton, {
					icon: Icons.Add,
					title: "newEvent_action",
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
