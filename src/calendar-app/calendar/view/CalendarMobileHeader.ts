import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { ViewSlider } from "../../../common/gui/nav/ViewSlider.js"
import { BaseMobileHeader } from "../../../common/gui/BaseMobileHeader.js"
import { OfflineIndicator } from "../../../common/gui/base/OfflineIndicator.js"
import { ProgressBar } from "../../../common/gui/base/ProgressBar.js"
import { CalendarNavConfiguration, getIconForViewType } from "../gui/CalendarGuiUtils.js"
import { MobileHeaderBackButton, MobileHeaderMenuButton, MobileHeaderTitle } from "../../../common/gui/MobileHeader.js"
import { AppHeaderAttrs } from "../../../common/gui/Header.js"
import { attachDropdown } from "../../../common/gui/base/Dropdown.js"
import { TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { styles } from "../../../common/gui/styles.js"
import { theme } from "../../../common/gui/theme.js"
import { ClickHandler } from "../../../common/gui/base/GuiUtils.js"
import { TodayIconButton } from "./TodayIconButton.js"
import { ExpanderButton } from "../../../common/gui/base/Expander.js"
import { isApp } from "../../../common/api/common/Env.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { NavButton } from "../../../common/gui/base/NavButton.js"
import { CalendarViewType } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { client } from "../../../common/misc/ClientDetector.js"

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
			left: this.renderTopLeftButton(attrs),
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
				this.renderDateNavigation(attrs),
				m(TodayIconButton, {
					click: attrs.onToday,
				}),
				this.renderViewSelector(attrs),
				client.isCalendarApp()
					? this.renderSearchNavigationButton()
					: m(IconButton, {
							icon: Icons.Add,
							title: "newEvent_action",
							click: attrs.onCreateEvent,
					  }),
			],
			injections: m(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }),
		})
	}

	private renderTopLeftButton(attrs: CalendarMobileHeaderAttrs) {
		if (attrs.viewType === CalendarViewType.AGENDA && history.state?.origin === CalendarViewType.MONTH) {
			return m(MobileHeaderBackButton, {
				backAction: () => {
					const date = history.state.dateString ?? new Date().toISOString().substring(0, 10)
					m.route.set("/calendar/:view/:date", {
						view: CalendarViewType.MONTH,
						date,
					})
				},
			})
		} else if (styles.isUsingBottomNavigation() && styles.isDesktopLayout()) {
			return null
		}

		return m(MobileHeaderMenuButton, { newsModel: attrs.newsModel, backAction: () => attrs.viewSlider.focusPreviousColumn() })
	}

	private renderSearchNavigationButton() {
		if (locator.logins.isInternalUserLoggedIn()) {
			return m(
				".icon-button",
				m(NavButton, {
					label: "search_label",
					hideLabel: true,
					icon: () => BootIcons.Search,
					href: "/search/calendar",
					centred: true,
					fillSpaceAround: false,
				}),
			)
		}

		return null
	}

	private renderDateNavigation(attrs: CalendarMobileHeaderAttrs) {
		if (isApp() || !(styles.isSingleColumnLayout() || styles.isTwoColumnLayout())) {
			return null
		}

		return m.fragment({}, [attrs.navConfiguration.back, attrs.navConfiguration.forward])
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
