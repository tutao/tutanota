import m, { Children, VnodeDOM } from "mithril"
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js"
import { focusNext, focusPrevious, Shortcut } from "../../../common/misc/KeyManager.js"
import { BaseButton, BaseButtonAttrs } from "../../../common/gui/base/buttons/BaseButton.js"
import { PosRect, showDropdown } from "../../../common/gui/base/Dropdown.js"
import { MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { size } from "../../../common/gui/size.js"
import { AllIcons, Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { theme } from "../../../common/gui/theme.js"
import { Keys, TabIndex } from "../../../common/api/common/TutanotaConstants.js"
import { getElementId } from "../../../common/api/common/utils/EntityUtils.js"
import { getLabelColor } from "../../../common/gui/base/Label.js"
import { LabelState } from "../model/MailModel.js"

/**
 * Popup that displays assigned labels and allows changing them
 */
export class LabelsPopup implements ModalComponent {
	private dom: HTMLElement | null = null

	constructor(
		private readonly sourceElement: HTMLElement,
		private readonly origin: PosRect,
		private readonly width: number,
		private readonly labels: { label: MailFolder; state: LabelState }[],
		private readonly onLabelsApplied: (addedLabels: MailFolder[], removedLabels: MailFolder[]) => unknown,
	) {
		this.view = this.view.bind(this)
		this.oncreate = this.oncreate.bind(this)
	}

	async hideAnimation(): Promise<void> {}

	onClose(): void {}

	shortcuts(): Shortcut[] {
		return this.shortCuts
	}

	backgroundClick(e: MouseEvent): void {
		modal.remove(this)
	}

	popState(e: Event): boolean {
		return true
	}

	callingElement(): HTMLElement | null {
		return this.sourceElement
	}

	view(): void | Children {
		return m(".flex.col.elevated-bg.abs.dropdown-shadow.pt-s.border-radius", { tabindex: TabIndex.Programmatic }, [
			m(
				".pb-s.scroll",
				this.labels.map((labelState) => {
					const { label, state } = labelState
					const color = theme.content_button
					return m(
						"label-item.flex.items-center.plr.state-bg.cursor-pointer",

						{
							"data-labelid": getElementId(label),
							tabindex: TabIndex.Default,
							onclick: () => this.toggleLabel(labelState),
						},
						[
							m(Icon, {
								icon: this.iconForState(state),
								size: IconSize.Medium,
								style: {
									fill: getLabelColor(label.color),
								},
							}),
							m(".button-height.flex.items-center.ml", { style: { color } }, label.name),
						],
					)
				}),
			),
			m(BaseButton, {
				label: "Apply",
				text: "Apply",
				class: "limit-width noselect bg-transparent button-height text-ellipsis content-accent-fg flex items-center plr-button button-content justify-center border-top state-bg",
				onclick: () => {
					this.applyLabels()
				},
			} satisfies BaseButtonAttrs),
		])
	}

	private iconForState(state: LabelState): AllIcons {
		switch (state) {
			case LabelState.AppliedToSome:
				return Icons.LabelPartial
			case LabelState.Applied:
				return Icons.Label
			case LabelState.NotApplied:
				return Icons.LabelOutline
		}
	}

	private applyLabels() {
		const removedLabels: MailFolder[] = []
		const addedLabels: MailFolder[] = []
		for (const { label, state } of this.labels) {
			if (state === LabelState.Applied) {
				addedLabels.push(label)
			} else if (state === LabelState.NotApplied) {
				removedLabels.push(label)
			}
		}
		this.onLabelsApplied(addedLabels, removedLabels)
		modal.remove(this)
	}

	oncreate(vnode: VnodeDOM) {
		this.dom = vnode.dom as HTMLElement

		// restrict label height to showing maximum 6 labels to avoid overflow
		const displayedLabels = Math.min(this.labels.length, 6)
		const height = (displayedLabels + 1) * size.button_height + size.vpad_small * 2
		showDropdown(this.origin, this.dom, height, this.width).then(() => {
			const firstLabel = vnode.dom.getElementsByTagName("label-item").item(0)
			if (firstLabel !== null) {
				;(firstLabel as HTMLElement).focus()
			} else {
				;(vnode.dom as HTMLElement).focus()
			}
		})
	}

	private readonly shortCuts: Array<Shortcut> = [
		{
			key: Keys.ESC,
			exec: () => this.onClose(),
			help: "close_alt",
		},
		{
			key: Keys.TAB,
			shift: true,
			exec: () => (this.dom ? focusPrevious(this.dom) : false),
			help: "selectPrevious_action",
		},
		{
			key: Keys.TAB,
			shift: false,
			exec: () => (this.dom ? focusNext(this.dom) : false),
			help: "selectNext_action",
		},
		{
			key: Keys.UP,
			exec: () => (this.dom ? focusPrevious(this.dom) : false),
			help: "selectPrevious_action",
		},
		{
			key: Keys.DOWN,
			exec: () => (this.dom ? focusNext(this.dom) : false),
			help: "selectNext_action",
		},
		{
			key: Keys.RETURN,
			exec: () => this.applyLabels(),
			help: "ok_action",
		},
		{
			key: Keys.SPACE,
			exec: () => {
				const labelId = document.activeElement?.getAttribute("data-labelid")
				if (labelId) {
					const labelItem = this.labels.find((item) => getElementId(item.label) === labelId)
					if (labelItem) {
						this.toggleLabel(labelItem)
					}
				} else {
					return true
				}
			},
			help: "ok_action",
		},
	]

	show() {
		modal.displayUnique(this, false)
	}

	private toggleLabel(labelState: { label: MailFolder; state: LabelState }) {
		if (labelState.state === LabelState.NotApplied || labelState.state === LabelState.AppliedToSome) {
			labelState.state = LabelState.Applied
		} else {
			labelState.state = LabelState.NotApplied
		}
	}
}
