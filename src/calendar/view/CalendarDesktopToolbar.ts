import { CalendarNavConfiguration, CalendarViewType, getIconForViewType } from "../gui/CalendarGuiUtils.js"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../gui/theme.js"
import { px, size } from "../../gui/size.js"
import { TodayIconButton } from "./CalendarMobileHeader.js"
import { TranslationText } from "../../misc/LanguageViewModel.js"
import { IconSegmentControl } from "../../gui/base/IconSegmentControl.js"
import { AllIcons } from "../../gui/base/Icon.js"

type CalendarDesktopToolbarAttrs = {
	navConfig: CalendarNavConfiguration
	viewType: CalendarViewType
	onToday: () => unknown
	onViewTypeSelected: (viewType: CalendarViewType) => unknown
}

export class CalendarDesktopToolbar implements Component<CalendarDesktopToolbarAttrs> {
	view({ attrs }: Vnode<CalendarDesktopToolbarAttrs>): Children {
		const { navConfig } = attrs
		return m(
			".flex.row.items-center.content-bg.border-radius-big.mlr-l.rel.pr.pl-vpad",
			{
				style: {
					marginLeft: `5px`,
					marginBottom: px(size.hpad_large),
				},
			},
			[
				m("h1", navConfig.title),
				navConfig.week && this.renderWeekNumberLabel(navConfig.week),
				m(".flex.items-center.justify-center.flex-grow.height-100p", this.renderViewSelector(attrs)),
				m(".flex.pt-xs.pb-xs", [
					navConfig.back ?? m(".button-width-fixed"),
					m(
						".flex",
						m(TodayIconButton, {
							click: attrs.onToday,
						}),
					),
					navConfig.forward ?? m(".button-width-fixed"),
				]),
			],
		)
	}

	private renderViewSelector(attrs: CalendarDesktopToolbarAttrs): Children {
		const calendarViewValues: Array<{ icon: AllIcons; label: TranslationText; value: CalendarViewType }> = [
			{
				icon: getIconForViewType(CalendarViewType.AGENDA),
				label: "agenda_label",
				value: CalendarViewType.AGENDA,
			},
			{
				icon: getIconForViewType(CalendarViewType.DAY),
				label: "day_label",
				value: CalendarViewType.DAY,
			},
			{
				icon: getIconForViewType(CalendarViewType.WEEK),
				label: "week_label",
				value: CalendarViewType.WEEK,
			},
			{
				icon: getIconForViewType(CalendarViewType.MONTH),
				label: "month_label",
				value: CalendarViewType.MONTH,
			},
		]

		// always center the segment control inside the toolbar
		return m(
			".abs.center-h",
			{
				style: {
					left: 0,
					right: 0,
					// need explicit width to center the control
					width: px(size.icon_segment_control_button_width * 4),
				},
			},
			m(IconSegmentControl, {
				selectedValue: attrs.viewType,
				onValueSelected: (type: CalendarViewType) => attrs.onViewTypeSelected(type),
				items: calendarViewValues,
				maxItemWidth: 48,
			}),
		)
	}

	private renderWeekNumberLabel(label: string): Children {
		return m(
			".ml-m.small.font-weight-600",
			{
				style: {
					padding: "2px 8px",
					backgroundColor: theme.list_alternate_bg,
				},
			},
			label,
		)
	}
}
