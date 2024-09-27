import { pureComponent } from "./base/PureComponent.js"
import m, { Children, Component, Vnode } from "mithril"
import { NBSP } from "@tutao/tutanota-utils"
import { AppHeaderAttrs } from "./Header.js"
import { BaseMobileHeader } from "./BaseMobileHeader.js"
import { IconButton } from "./base/IconButton.js"
import { BootIcons } from "./base/icons/BootIcons.js"
import { styles } from "./styles.js"
import { OfflineIndicator } from "./base/OfflineIndicator.js"
import { ProgressBar } from "./base/ProgressBar.js"
import { CounterBadge } from "./base/CounterBadge.js"
import { px } from "./size.js"
import { theme } from "./theme.js"
import { NewsModel } from "../misc/news/NewsModel.js"
import { ClickHandler } from "./base/GuiUtils.js"

export interface MobileHeaderAttrs extends AppHeaderAttrs {
	columnType: "first" | "other"
	/** Actions that should be displayed on the opposite side of menu/back button. */
	actions: Children
	/** Like actions that are only supposed to be displayed in multi-column layout */
	multicolumnActions?: () => Children
	/**
	 * An action that is displayed in the corner of the screen opposite of menu/back button, will be displayed in any column in single column layout or
	 * in the second column in two column layout.
	 */
	primaryAction: () => Children
	title?: string
	backAction: () => unknown
	useBackButton?: boolean
}

/**
 * A component that renders a "standard" mobile header. It has menu/back button with offline indicator, title and online status, sync progress and some
 * actions.
 *
 * It is intended to be used in both the first ("list") and the second ("viewer") columns. It will automatically figure whether it should display menu/back
 * button, title and actions.
 */
export class MobileHeader implements Component<MobileHeaderAttrs> {
	view({ attrs }: Vnode<MobileHeaderAttrs>): Children {
		const firstVisibleColumn = attrs.columnType === "first" || styles.isSingleColumnLayout()
		return m(BaseMobileHeader, {
			left: this.renderLeftAction(attrs),
			center: firstVisibleColumn
				? m(MobileHeaderTitle, {
						title: attrs.title,
						bottom: m(OfflineIndicator, attrs.offlineIndicatorModel.getCurrentAttrs()),
				  })
				: null,
			right: [
				styles.isSingleColumnLayout() ? null : attrs.multicolumnActions?.(),
				attrs.actions,
				styles.isSingleColumnLayout() || attrs.columnType === "other" ? attrs.primaryAction() : null,
			],
			injections: firstVisibleColumn ? m(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }) : null,
		})
	}

	private renderLeftAction(attrs: MobileHeaderAttrs) {
		if (attrs.columnType === "first" && !attrs.useBackButton) {
			return m(MobileHeaderMenuButton, { newsModel: attrs.newsModel, backAction: attrs.backAction })
		} else if (styles.isSingleColumnLayout() || attrs.useBackButton) {
			return m(MobileHeaderBackButton, { backAction: attrs.backAction })
		}

		return null
	}
}

export const MobileHeaderBackButton = pureComponent(({ backAction }: { backAction: () => unknown }) => {
	return m(IconButton, {
		title: "back_action",
		icon: BootIcons.Back,
		click: () => {
			backAction()
		},
	})
})

export const MobileHeaderTitle = pureComponent(({ title, bottom, onTap }: { title?: string | Children; bottom: Children; onTap?: ClickHandler }) => {
	// normally min-width: is 0 but inside flex it's auto and we need to teach it how to shrink
	// align-self: stretch restrict the child to the parent width
	// text-ellipsis already sets min-width to 0
	return m(".flex.col.items-start.min-width-0", [
		m(
			(onTap ? "button" : "") + ".font-weight-600.text-ellipsis.align-self-stretch",
			{ onclick: (event: MouseEvent) => onTap?.(event, event.target as HTMLElement) },
			title ?? NBSP,
		),
		bottom,
	])
})

export const MobileHeaderMenuButton = pureComponent(({ newsModel, backAction }: { newsModel: NewsModel; backAction: () => unknown }) => {
	return m(".rel", [
		m(IconButton, {
			title: "menu_label",
			icon: BootIcons.MoreVertical,
			click: () => {
				backAction()
			},
		}),
		m(CounterBadge, {
			count: newsModel.liveNewsIds.length,
			position: {
				top: px(4),
				right: px(5),
			},
			color: "white",
			background: theme.list_accent_fg,
		}),
	])
})
