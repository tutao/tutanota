import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { isSameDayOfDate, noOp } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"

export const enum OfflineIndicatorState {
	Offline = 0,
	Connecting = 1,
	Synchronizing = 2,
	Online = 3,
}

export type OfflineIndicatorAttrs =
	| { state: OfflineIndicatorState.Online; isSingleColumn: boolean }
	| { state: OfflineIndicatorState.Connecting; isSingleColumn: boolean }
	| { state: OfflineIndicatorState.Synchronizing; progress: number; isSingleColumn: boolean }
	| { state: OfflineIndicatorState.Offline; lastUpdate: Date | null; reconnectAction: () => void; isSingleColumn: boolean }

/**
 * the first line of the offline indicator shows if we're offline or online and
 * adds action prompts (if any)
 * it's returned as a span so the consumer can decide how to layout it.
 */
function attrToFirstLine(state: OfflineIndicatorState | null): Children {
	switch (state) {
		case OfflineIndicatorState.Online:
		case OfflineIndicatorState.Synchronizing:
			return m("span", lang.get("online_label"))
		case OfflineIndicatorState.Offline:
			return m("span", [lang.get("offline_label"), m("span.b.content-accent-fg.mlr-s", lang.get("reconnect_action"))])
		case OfflineIndicatorState.Connecting:
			return m("span", lang.get("offline_label"))
	}
}

/**
 * the second line provides additional information about the current state.
 * it's returned as a span so the consumer can decide how to layout it.
 */
function attrToSecondLine(connectionState: OfflineIndicatorAttrs | null): Children {
	switch (connectionState?.state) {
		case OfflineIndicatorState.Online:
			return m("span", lang.get("upToDate_label"))
		case OfflineIndicatorState.Offline:
			if (connectionState.lastUpdate) {
				return m("span", lang.get("lastSync_label", { "{date}": formatDate(connectionState.lastUpdate) }))
			} else {
				// never synced, don't show last sync label
				return null
			}
		case OfflineIndicatorState.Synchronizing:
			return m("span", lang.get("synchronizing_label", { "{progress}": formatPercentage(connectionState.progress) }))
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

export class ConnectionStateIndicator implements Component<OfflineIndicatorAttrs> {
	private dom: HTMLElement | null = null
	private lastConnectionState: OfflineIndicatorAttrs | null = null
	private bannerHeight = 0

	oncreate(vnode: VnodeDOM<OfflineIndicatorAttrs>) {
		this.dom = vnode.dom as HTMLElement
		this.bannerHeight = (this.dom as HTMLElement).getBoundingClientRect()?.height
		this.dom.style.marginTop = `${-this.bannerHeight}px`
		setTimeout(() => (this.dom!.style.transition = `margin-top .3s linear .2s, color .2s linear, background-color .2s linear`), 500)
	}

	onupdate({ attrs }: Vnode<OfflineIndicatorAttrs>) {
		if (attrs.state === this.lastConnectionState?.state) return
		this.lastConnectionState = attrs
		m.redraw()
	}

	view(): Children {
		const isOffline = this.lastConnectionState?.state === OfflineIndicatorState.Offline
		const extraClasses = isOffline ? ".offline" : ""
		let margin = "0"
		if (!isOffline && this.lastConnectionState?.state === OfflineIndicatorState.Online) margin = `${-this.bannerHeight}px`

		return m(
			`.status-banner.center.small.pt-xs.pb-xs.pl.pr${extraClasses}`,
			{
				style: {
					"margin-top": margin,
				},
			},
			[
				m(
					"button.small.center",
					{
						type: "button",
						href: "#",
						tabindex: "0",
						role: "button",
						"aria-disabled": !isOffline,
						onclick: this.lastConnectionState?.state === OfflineIndicatorState.Offline ? this.lastConnectionState?.reconnectAction : noOp,
					},
					[attrToFirstLine(this.lastConnectionState?.state ?? null), " ", attrToSecondLine(this.lastConnectionState)],
				),
			],
		)
	}
}
