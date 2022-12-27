import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../theme"
import { isSameDayOfDate, noOp } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"

export const enum OfflineIndicatorState {
	Offline = 0,
	Connecting = 1,
	Synchronizing = 2,
	Online = 3,
}

export type OfflineIndicatorAttrs =
	| { state: OfflineIndicatorState.Online }
	| { state: OfflineIndicatorState.Connecting }
	| { state: OfflineIndicatorState.Synchronizing; progress: number }
	| { state: OfflineIndicatorState.Offline; lastUpdate: Date | null; reconnectAction: () => void }

/**
 * the first line of the offline indicator shows if we're offline or online and
 * adds action prompts (if any)
 * it's returned as a span so the consumer can decide how to layout it.
 */
function attrToFirstLine(attr: OfflineIndicatorAttrs): Children {
	const { state } = attr
	switch (state) {
		case OfflineIndicatorState.Online:
		case OfflineIndicatorState.Synchronizing:
			return m("span", lang.get("online_label"))

		case OfflineIndicatorState.Offline:
			return [m("span", lang.get("offline_label")), m("span.b.content-accent-fg.mlr-s", lang.get("reconnect_action"))]
		case OfflineIndicatorState.Connecting:
			return m("span", lang.get("offline_label"))
	}
}

/**
 * the second line provides additional information about the current state.
 * it's returned as a span so the consumer can decide how to layout it.
 */
function attrToSecondLine(a: OfflineIndicatorAttrs): Children {
	switch (a.state) {
		case OfflineIndicatorState.Online:
			return m("span", lang.get("upToDate_label"))
		case OfflineIndicatorState.Offline:
			if (a.lastUpdate) {
				return m("span", lang.get("lastSync_label", { "{date}": formatDate(a.lastUpdate) }))
			} else {
				// never synced, don't show last sync label
				return null
			}
		case OfflineIndicatorState.Synchronizing:
			return m("span", lang.get("synchronizing_label", { "{progress}": formatPercentage(a.progress) }))
		case OfflineIndicatorState.Connecting:
			return m("span", lang.get("reconnecting_label"))
	}
}

/**
 * format a number as a percentage string with 0 = 0% and 1 = 100%
 */
function formatPercentage(percentage: number): string {
	return `${Math.round(percentage * 100)}%`
}

/*
 * format a date either as a time without date (if it's today) or
 * as a date without time
 */
function formatDate(date: Date): string {
	return isSameDayOfDate(new Date(), date) ? lang.formats.time.format(date) : lang.formats.simpleDate.format(date)
}

export class OfflineIndicatorDesktop implements Component<OfflineIndicatorAttrs> {
	view(vnode: Vnode<OfflineIndicatorAttrs>): Children {
		const a = vnode.attrs
		return m(
			"button.small.pt-s.mlr-l.flex.col",
			{
				type: "button",
				href: "#",
				tabindex: "0",
				role: "button",
				onclick: a.state === OfflineIndicatorState.Offline ? a.reconnectAction : noOp,
			},
			[m("", { color: theme.content_accent }, attrToFirstLine(a)), m("", { color: theme.content_accent }, attrToSecondLine(a))],
		)
	}
}

export class OfflineIndicatorMobile implements Component<OfflineIndicatorAttrs> {
	view(vnode: Vnode<OfflineIndicatorAttrs>): Children {
		const a = vnode.attrs
		const secondLine = attrToSecondLine(a)
		return m(
			"button.small.center.mb-xs",
			{
				type: "button",
				href: "#",
				tabindex: "0",
				role: "button",
				onclick: a.state === OfflineIndicatorState.Offline ? a.reconnectAction : noOp,
			},
			attrToFirstLine(a),
		)
	}
}
