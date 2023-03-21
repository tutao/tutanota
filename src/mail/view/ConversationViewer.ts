import m, { Children, Component, Vnode } from "mithril"
import { ConversationItem, ConversationViewModel, SubjectItem } from "./ConversationViewModel.js"
import { MailViewer } from "./MailViewer.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { theme } from "../../gui/theme.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { assertNotNull, NBSP } from "@tutao/tutanota-utils"
import { elementIdPart, isSameId } from "../../api/common/utils/EntityUtils.js"
import { CollapsedMailView } from "./CollapsedMailView.js"
import { mailViewerMargin } from "./MailViewerUtils.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { max } from "@tutao/tutanota-utils/dist/CollectionUtils.js"
import { px, size } from "../../gui/size.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { keyManager, Shortcut } from "../../misc/KeyManager.js"
import { styles } from "../../gui/styles.js"
import { client } from "../../misc/ClientDetector"

export interface ConversationViewerAttrs {
	viewModel: ConversationViewModel
}

const SCROLL_FACTOR = 4 / 5

const conversationCardMargin = 18

/**
 * Displays mails in a conversation
 */
export class ConversationViewer implements Component<ConversationViewerAttrs> {
	private containerDom: HTMLElement | null = null
	private floatingSubjectDom: HTMLElement | null = null
	private didScroll = false
	/** items from the last render, we need them to calculate the right subject based on the scroll position without the full re-render. */
	private lastItems: readonly ConversationItem[] | null = null
	/** ids of the subject entries above the currently visible items. */
	private subjectsAboveViewport: Set<string> = new Set()

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
		const { viewModel } = vnode.attrs
		this.lastItems = viewModel.conversationItems()
		this.doScroll(viewModel, this.lastItems)

		return m(".fill-absolute.nav-bg", [
			m(
				".fill-absolute.scroll",
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
			client.isMobileDevice() ? null : this.renderFloatingSubject(),
		])
	}

	private renderFooter() {
		// Having more room at the bottom allows the last email so it is (almost) always in the same place on the screen.
		// We reduce space by 100 for the header of the viewer and a bit more
		const height =
			document.body.offsetHeight - (styles.isUsingBottomNavigation() ? size.navbar_height_mobile + size.bottom_nav_bar : size.navbar_height) - 100
		return m(".mt-l", {
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
				case "subject": {
					return this.renderSubject(entry.subject, entry.id)
				}
				case "deleted": {
					return m(DeletedMailView, { key: elementIdPart(entry.entryId) })
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
					".font-weight-600.center.mt-l" + "." + mailViewerMargin(),
					{
						style: {
							color: theme.content_button,
						},
					},
					lang.get("loading_msg"),
			  )
			: null
	}

	private renderFloatingSubject(): Children {
		return m(
			".abs.nav-bg",
			{
				class: mailViewerMargin(),
				style: {
					top: 0,
					left: 0,
					right: 0,
					transform: "translateY(-100%)",
				},
			},
			m(
				".b.h5.subject.text-break.text-ellipsis.selectable",
				{
					oncreate: ({ dom }) => {
						this.floatingSubjectDom = dom as HTMLElement
					},
					style: {
						marginTop: px(conversationCardMargin),
						marginBottom: px(conversationCardMargin),
					},
				},
				"",
			),
		)
	}

	private renderViewer(mailViewModel: MailViewerViewModel, isPrimary: boolean, position: number | null): Children {
		return m(
			".border-radius-big.rel",
			{
				class: mailViewerMargin(),
				key: elementIdPart(mailViewModel.mail.conversationEntry),
				style: {
					border: `1px solid ${theme.list_border}`,
					backgroundColor: theme.content_bg,
					marginTop: px(conversationCardMargin),
				},
			},
			mailViewModel.isCollapsed()
				? m(CollapsedMailView, {
						viewModel: mailViewModel,
				  })
				: m(MailViewer, {
						viewModel: mailViewModel,
						isPrimary: isPrimary,
						//  position 0 is a subject and we want to expand for the first email
						// like when it's a forwarded email
						defaultQuoteBehavior: position === 1 ? "expand" : "collapse",
				  }),
		)
	}

	private renderSubject(normalizedSubject: string, id: string): Children {
		return m(ObservableSubject, {
			subject: normalizedSubject,
			cb: (visiblity) => this.onSubjectVisible(id, visiblity),
			// we use id as the key:
			// It is unique: each email appears only once (when sending to self,sent and received emails are independent). The subject text however can appear multiple times.
			// It is more predicatable (regarding visiblity) if the element gets destroyed and created again.
			key: "item-subject-" + id,
		})
	}

	private onSubjectVisible(id: string, visibility: SubjectVisiblity) {
		switch (visibility) {
			case "visible":
				this.subjectsAboveViewport.delete(id)
				break
			case "above":
				this.subjectsAboveViewport.add(id)
				break
			case "below":
				this.subjectsAboveViewport.delete(id)
				break
		}
		if (this.floatingSubjectDom) {
			if (this.subjectsAboveViewport.size === 0) {
				// all subjects above us are visible, hide the sticky subject
				this.floatingSubjectDom.parentElement!.style.transform = "translateY(-100%)"
			} else {
				this.floatingSubjectDom.parentElement!.style.transform = ""
				// use NBSP to keep the height
				this.floatingSubjectDom.innerText = this.subjectForFloatingHeader() ?? NBSP
			}
		}
	}

	private subjectForFloatingHeader(): string | null {
		const entries = this.lastItems
		if (!entries) return null
		// knowingly N^2
		const lastInvisibleSubject = max(Array.from(this.subjectsAboveViewport).map((id) => entries.findIndex((e) => e.type === "subject" && e.id === id)))
		// We might not find anything if nothing is above the viewport. Another case is when the subject item has changed e.g. it was from the primary email but then we loaded
		// the conversation and now we have this subject from another email earlier in the chain and we can't find
		// the subject temporarily.
		if (lastInvisibleSubject == null || lastInvisibleSubject === -1) return null
		return (entries[lastInvisibleSubject] as SubjectItem).subject
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
				if (itemIndex > 1) {
					const top = (containerDom.childNodes[itemIndex] as HTMLElement).offsetTop
					// The single pixel seems to make the difference between jittering or not. Inferred empiraically.
					containerDom.scrollTo({ top: top - calculateSubjectHeaderHeight() + 1 })
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

type SubjectVisiblity = "above" | "below" | "visible"

interface ObservableSubjectAttrs {
	cb: (visibility: SubjectVisiblity) => unknown
	subject: string
}

export class ObservableSubject implements Component<ObservableSubjectAttrs> {
	lastAttrs: ObservableSubjectAttrs

	observer: IntersectionObserver | null = null

	constructor(vnode: Vnode<ObservableSubjectAttrs>) {
		this.lastAttrs = vnode.attrs
	}

	view(vnode: Vnode<ObservableSubjectAttrs>): Children {
		this.lastAttrs = vnode.attrs
		return m(
			".h5.subject.text-break.selectable.b.flex-grow",
			{
				class: mailViewerMargin(),
				"aria-label": lang.get("subject_label") + ", " + (this.lastAttrs.subject || ""),
				style: { marginTop: px(conversationCardMargin) },
				oncreate: (vnode) => {
					this.observer = new IntersectionObserver(
						(entries) => {
							const [entry] = entries
							const visibility = entry.isIntersecting
								? "visible"
								: entry.boundingClientRect.bottom < assertNotNull(entry.rootBounds).top
								? "above"
								: "below"
							this.lastAttrs.cb(visibility)
						},
						{ root: vnode.dom.parentElement, rootMargin: px(-calculateSubjectHeaderHeight()) },
					)
					this.observer.observe(vnode.dom)
				},
				onremove: (vnode) => {
					this.observer?.unobserve(vnode.dom)
				},
			},
			this.lastAttrs.subject,
		)
	}
}

class DeletedMailView implements Component {
	view() {
		return m(
			".center.pt-s.pb-s.font-weight-600.border-radius-big",
			{
				class: mailViewerMargin(),
				style: {
					border: `1px solid ${theme.list_border}`,
					color: theme.content_button,
					marginTop: px(conversationCardMargin),
				},
			},
			"Deleted Email",
		)
	}
}

function calculateSubjectHeaderHeight(): number {
	// size.font_size_base * 1.2 = font size of h5
	return conversationCardMargin * 2 + size.line_height * size.font_size_base * 1.2
}
