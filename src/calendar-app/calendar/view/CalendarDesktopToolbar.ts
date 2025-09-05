import { CalendarNavConfiguration, getIconForViewType } from "../gui/CalendarGuiUtils.js"
import m, { Children, Component, Vnode } from "mithril"
import { component_size, px, size } from "../../../common/gui/size.js"
import { lang, MaybeTranslation } from "../../../common/misc/LanguageViewModel.js"
import { IconSegmentControl } from "../../../common/gui/base/IconSegmentControl.js"
import { AllIcons } from "../../../common/gui/base/Icon.js"
import { TodayIconButton } from "./TodayIconButton.js"
import { CalendarViewType } from "../../../common/api/common/utils/CommonCalendarUtils.js"

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
			".flex.row.items-center.content-bg.border-radius-12.mlr-24.rel.pr-12.pl-16",
			{
				style: {
					marginLeft: `5px`,
					marginBottom: px(size.spacing_16),
				},
			},
			[
				m("h1", navConfig.title),
				m(".flex.items-center.justify-center.flex-grow.height-100p", this.renderViewSelector(attrs)),
				m(".flex.pt-4.pb-4", [
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
		const calendarViewValues: Array<{ icon: AllIcons; label: MaybeTranslation; value: CalendarViewType }> = [
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
				icon: getIconForViewType(CalendarViewType.THREE_DAY),
				label: "threeDays_label",
				value: CalendarViewType.THREE_DAY,
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
				role: "tablist",
				"aria-label": lang.get("periodOfTime_label"),
				style: {
					left: 0,
					right: 0,
					// need explicit width to center the control
					width: px(component_size.icon_segment_control_button_width * 4),
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
}
