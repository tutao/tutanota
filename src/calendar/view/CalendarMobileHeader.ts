import { CalendarViewType } from "./CalendarViewModel.js"
import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../gui/base/IconButton.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { BaseMobileHeader } from "../../gui/BaseMobileHeader.js"
import { OfflineIndicatorMobile } from "../../gui/base/OfflineIndicator.js"
import { ProgressBar } from "../../gui/base/ProgressBar.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { CalendarNavConfiguration } from "./CalendarGuiUtils.js"
import { MobileHeaderMenuButton, MobileHeaderTitle } from "../../gui/MobileHeader.js"
import { AppHeaderAttrs } from "../../gui/Header.js"

export interface CalendarMobileHeaderAttrs extends AppHeaderAttrs {
	viewType: CalendarViewType
	viewSlider: ViewSlider
	navConfiguration: CalendarNavConfiguration
	onBack: () => unknown
	onCreateEvent: () => unknown
}

/**
 * A special header that is used instead of {@link MobileHeader} but just for calendar.
 */
export class CalendarMobileHeader implements Component<CalendarMobileHeaderAttrs> {
	view({ attrs }: Vnode<CalendarMobileHeaderAttrs>): Children {
		return m(BaseMobileHeader, {
			left:
				attrs.viewType === CalendarViewType.DAY || attrs.viewType === CalendarViewType.WEEK
					? m(IconButton, {
							icon: BootIcons.Back,
							title: "back_action",
							click: attrs.onBack,
					  })
					: m(MobileHeaderMenuButton, { viewSlider: attrs.viewSlider, newsModel: attrs.newsModel }),
			center: m(MobileHeaderTitle, {
				title: attrs.navConfiguration.title,
				bottom: m(OfflineIndicatorMobile, attrs.offlineIndicatorModel.getCurrentAttrs()),
			}),
			right: [
				attrs.navConfiguration.back,
				attrs.navConfiguration.forward,
				m(IconButton, {
					icon: Icons.Add,
					title: "createEvent_label",
					click: attrs.onCreateEvent,
				}),
			],
			injections: m(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }),
		})
	}
}
