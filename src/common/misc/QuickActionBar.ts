import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { px, size } from "../gui/size"
import { TextField } from "../gui/base/TextField"
import { modal } from "../gui/base/Modal"
import { isKeyPressed, Shortcut } from "./KeyManager"
import { lastIndex, remove } from "@tutao/tutanota-utils"
import { Keys } from "../api/common/TutanotaConstants"
import { highlightTextInQueryAsChildren } from "../gui/TextHighlightViewUtils"
import { theme } from "../gui/theme"

export interface QuickAction {
	readonly description: string
	readonly exec: () => unknown
}

type LazyActionProvider = () => Promise<readonly QuickAction[]>

export class QuickActionsModel {
	private readonly _lastRunActions: QuickAction[] = []
	private actions: readonly QuickAction[] = []
	private readonly providers: LazyActionProvider[] = []

	register(actionProvider: LazyActionProvider) {
		this.providers.push(actionProvider)
	}

	async updateActions(): Promise<void> {
		const result: QuickAction[] = []
		for (const actionProvider of this.providers) {
			const actions = await actionProvider()
			result.push(...actions)
		}
		this.actions = result
	}

	runAction(action: QuickAction) {
		remove(this._lastRunActions, action)
		this._lastRunActions.unshift(action)
		action.exec()
	}

	lastActions(): readonly QuickAction[] {
		return this._lastRunActions
	}

	getMatchingActions(query: string): readonly QuickAction[] {
		const lowerQuery = query.toLowerCase()
		return this.actions.filter((pr) => pr.description.toLowerCase().includes(lowerQuery))
	}
}

interface Attrs {
	runAction: (action: QuickAction) => unknown
	getInitialActions: () => Promise<readonly QuickAction[]>
	getMatchingActions: (query: string) => readonly QuickAction[]
	close: () => unknown
}

class QuickActionBar implements Component<Attrs> {
	private query = ""
	private results: readonly QuickAction[] = []
	private selectedIndex: number = 0
	private listDom: HTMLElement | null = null

	oninit({ attrs: { getInitialActions, getMatchingActions } }: Vnode<Attrs>) {
		getInitialActions().then((initialActions) => {
			this.results = initialActions
			m.redraw()
		})
	}

	view({ attrs: { close, runAction, getMatchingActions } }: Vnode<Attrs>): Children {
		return m(
			".flex.col",
			{
				style: {
					maxWidth: "50vw",
					maxHeight: "80vh",
					background: "white",
					borderRadius: px(size.border_radius_large),
					margin: "10vh auto",
					padding: px(size.hpad),
				},
			},
			[
				m(TextField, {
					label: "action_label",
					value: this.query,
					class: "flex-no-grow-no-shrink-auto",
					oninput: (newValue) => {
						this.query = newValue
						this.results = getMatchingActions(newValue)
						this.selectedIndex = 0
					},
					onDomInputCreated: (dom) => {
						setTimeout(() => dom.focus(), 32)
					},
					onReturnKeyPressed: () => {
						const firstResult = this.results.at(this.selectedIndex)
						if (firstResult) {
							runAction(firstResult)
						}
						close()
					},
					keyHandler: (keyPress) => {
						if (isKeyPressed(keyPress.key, Keys.ESC)) {
							close()
						} else if (isKeyPressed(keyPress.key, Keys.UP)) {
							this.selectedIndex = Math.max(0, this.selectedIndex - 1)
							this.scrollToIndex()
							return false
						} else if (isKeyPressed(keyPress.key, Keys.DOWN)) {
							this.selectedIndex = Math.min(lastIndex(this.results), this.selectedIndex + 1)
							this.scrollToIndex()
							return false
						}
						return true
					},
				}),
				m(
					".flex.col.ul.mt-s.scroll.flex-grow",
					{
						style: {
							"list-style": "none",
							gap: "4px",
						},
						oncreate: (vnode: VnodeDOM) => {
							this.listDom = vnode.dom as HTMLElement
						},
					},
					this.results.map((result, index) =>
						m(
							"li.border-radius-small.plr-s.click",
							{
								style: {
									padding: "4px",
									backgroundColor: index === this.selectedIndex ? theme.state_bg_hover : undefined,
								},
								onclick: () => {
									const action = this.results.at(index)
									if (action) {
										runAction(action)
										close()
									}
								},
							},
							highlightTextInQueryAsChildren(result.description, [{ token: this.query, exact: false }]),
						),
					),
				),
			],
		)
	}

	private scrollToIndex() {
		if (this.listDom) {
			const child = this.listDom.children.item(this.selectedIndex)
			child?.scrollIntoView()
		}
	}
}

export function showQuickActionBar(model: QuickActionsModel) {
	const activeElement = document.activeElement
	const modalComponent = {
		view: () => {
			return m(QuickActionBar, {
				getInitialActions: async () => {
					await model.updateActions()
					return model.lastActions().concat(model.getMatchingActions(""))
				},
				getMatchingActions: (query) => model.getMatchingActions(query),
				runAction: (action) => model.runAction(action),
				close: () => modal.remove(modalComponent),
			} satisfies Attrs)
		},
		async hideAnimation(): Promise<void> {},

		onClose(): void {},

		shortcuts(): Shortcut[] {
			return []
		},

		backgroundClick(e: MouseEvent): void {
			modal.remove(modalComponent)
		},

		/**
		 * will be called by the main modal if no other component above this one blocked the event (previous components returned true)
		 * return false if the event was handled and lower components shouldn't be notified, true otherwise
		 * @param e
		 */
		popState(e: Event): boolean {
			return true
		},

		// The element that was interacted with to show the modal.
		callingElement(): HTMLElement | null {
			return activeElement as HTMLElement | null
		},
	}
	modal.display(modalComponent)
}
