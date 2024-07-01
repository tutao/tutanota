import m, { Children, Component, Vnode } from "mithril"
import { ConversationItem, ConversationViewModel } from "./ConversationViewModel.js"
import { MailViewer } from "./MailViewer.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { theme } from "../../../common/gui/theme.js"
import { Button, ButtonType } from "../../../common/gui/base/Button.js"
import { elementIdPart, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { CollapsedMailView } from "./CollapsedMailView.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { px, size } from "../../../common/gui/size.js"
import { Keys } from "../../../common/api/common/TutanotaConstants.js"
import { keyManager, Shortcut } from "../../../common/misc/KeyManager.js"
import { styles } from "../../../common/gui/styles.js"
import { responsiveCardHMargin } from "../../../common/gui/cards.js"

export interface ConversationViewerAttrs {
	viewModel: ConversationViewModel
	delayBodyRendering: Promise<unknown>
}

const SCROLL_FACTOR = 4 / 5

export const conversationCardMargin = size.hpad_large

/**
 * Displays mails in a conversation
 */
export class ConversationViewer implements Component<ConversationViewerAttrs> {
	private containerDom: HTMLElement | null = null
	private didScroll = false
	/** items from the last render, we need them to calculate the right subject based on the scroll position without the full re-render. */
	private lastItems: readonly ConversationItem[] | null = null

	private readonly shortcuts: Shortcut[] = [
		{
			key: Keys.PAGE_UP,
			exec: () => this.scrollUp(),
			help: "scrollUp_action",
		},
		{
			key: Keys.PAGE_DOWN,
			exec: () => this.scrollDown(),
			help: "scrollDown_action",
		},
		{
			key: Keys.HOME,
			exec: () => this.scrollToTop(),
			help: "scrollToTop_action",
		},
		{
			key: Keys.END,
			exec: () => this.scrollToBottom(),
			help: "scrollToBottom_action",
		},
	]

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	view(vnode: Vnode<ConversationViewerAttrs>): Children {
		const { viewModel, delayBodyRendering } = vnode.attrs

		viewModel.init(delayBodyRendering)

		this.lastItems = viewModel.conversationItems()
		this.doScroll(viewModel, this.lastItems)

		return m(".fill-absolute.nav-bg.flex.col", [
			// see comment for .scrollbar-gutter-stable-or-fallback
			m(
				".flex-grow.overflow-y-scroll",
				{
					oncreate: (vnode) => {
						this.containerDom = vnode.dom as HTMLElement
					},
					onremove: () => {
						console.log("remove container")
					},
				},
				this.renderItems(viewModel, this.lastItems),
				this.renderLoadingState(viewModel),
				this.renderFooter(),
			),
		])
	}

	private renderFooter() {
		// Having more room at the bottom allows the last email so it is (almost) always in the same place on the screen.
		// We reduce space by 100 for the header of the viewer and a bit more
		const height =
			document.body.offsetHeight - (styles.isUsingBottomNavigation() ? size.navbar_height_mobile + size.bottom_nav_bar : size.navbar_height) - 300
		return m(".mt-l.noprint", {
			style: {
				height: px(height),
			},
		})
	}

	private renderItems(viewModel: ConversationViewModel, entries: readonly ConversationItem[]): Children {
		return entries.map((entry, position) => {
			switch (entry.type) {
				case "mail": {
					const mailViewModel = entry.viewModel
					const isPrimary = mailViewModel === viewModel.primaryViewModel()
					// only pass in position if we do have an actual conversation position
					return this.renderViewer(mailViewModel, isPrimary, viewModel.isFinished() ? position : null)
				}
			}
		})
	}

	private renderLoadingState(viewModel: ConversationViewModel): Children {
		return viewModel.isConnectionLost()
			? m(
					".center",
					m(Button, {
						type: ButtonType.Secondary,
						label: "retry_action",
						click: () => viewModel.retry(),
					}),
			  )
			: !viewModel.isFinished()
			? m(
					".font-weight-600.center.mt-l" + "." + responsiveCardHMargin(),
					{
						style: {
							color: theme.content_button,
						},
					},
					lang.get("loading_msg"),
			  )
			: null
	}

	private renderViewer(mailViewModel: MailViewerViewModel, isPrimary: boolean, position: number | null): Children {
		return m(
			".mlr-safe-inset",
			m(
				".border-radius-big.rel",
				{
					class: responsiveCardHMargin(),
					key: elementIdPart(mailViewModel.mail.conversationEntry),
					style: {
						backgroundColor: theme.content_bg,
						marginTop: px(position == null || position === 0 ? 0 : conversationCardMargin),
					},
				},
				mailViewModel.isCollapsed()
					? m(CollapsedMailView, {
							viewModel: mailViewModel,
					  })
					: m(MailViewer, {
							viewModel: mailViewModel,
							isPrimary: isPrimary,
							// we want to expand for the first email like when it's a forwarded email
							defaultQuoteBehavior: position === 0 ? "expand" : "collapse",
					  }),
			),
		)
	}

	private doScroll(viewModel: ConversationViewModel, items: readonly ConversationItem[]) {
		const containerDom = this.containerDom
		if (!this.didScroll && containerDom && viewModel.isFinished()) {
			const conversationId = viewModel.primaryMail.conversationEntry

			this.didScroll = true
			// We need to do this at the end of the frame when every change is already applied.
			// Promise.resolve() schedules a microtask exactly where we need it.
			// RAF is too long and would flash the wrong frame
			Promise.resolve().then(() => {
				// There's a chance that item are not in sync with dom but it's very unlikely, this is the same frame after the last render we used the items
				// and viewModel is finished.
				const itemIndex = items.findIndex((e) => e.type === "mail" && isSameId(e.entryId, conversationId))
				// Don't scroll if it's already the first (or if we didn't find it but that would be weird)
				if (itemIndex > 0) {
					const childDom = containerDom.childNodes[itemIndex] as HTMLElement
					const parentTop = containerDom.getBoundingClientRect().top
					const childTop = childDom.getBoundingClientRect().top
					const relativeTop = childTop - parentTop
					const top = relativeTop - conversationCardMargin * 2 - 10
					containerDom.scrollTo({ top: top })
				}
			})
		}
	}

	private scrollUp(): void {
		if (this.containerDom) {
			this.containerDom.scrollBy({ top: -this.containerDom.clientHeight * SCROLL_FACTOR, behavior: "smooth" })
		}
	}

	private scrollDown(): void {
		if (this.containerDom) {
			this.containerDom.scrollBy({ top: this.containerDom.clientHeight * SCROLL_FACTOR, behavior: "smooth" })
		}
	}

	private scrollToTop(): void {
		if (this.containerDom) {
			this.containerDom.scrollTo({ top: 0, behavior: "smooth" })
		}
	}

	private scrollToBottom(): void {
		if (this.containerDom) {
			this.containerDom.scrollTo({ top: this.containerDom.scrollHeight - this.containerDom.offsetHeight, behavior: "smooth" })
		}
	}
}
