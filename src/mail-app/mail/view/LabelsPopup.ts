import m, { Children, VnodeDOM } from "mithril"
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js"
import { focusNext, focusPrevious, Shortcut } from "../../../common/misc/KeyManager.js"
import { BaseButton, BaseButtonAttrs } from "../../../common/gui/base/buttons/BaseButton.js"
import { PosRect, showDropdown } from "../../../common/gui/base/Dropdown.js"
import { MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { component_size, size } from "../../../common/gui/size.js"
import { AllIcons, Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { theme } from "../../../common/gui/theme.js"
import { Keys, MAX_LABELS_PER_MAIL, TabIndex } from "../../../common/api/common/TutanotaConstants.js"
import { getElementId } from "../../../common/api/common/utils/EntityUtils.js"
import { getLabelColor } from "../../../common/gui/base/Label.js"
import { LabelState } from "../model/MailModel.js"
import { AriaRole } from "../../../common/gui/AriaUtils.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { noOp } from "@tutao/tutanota-utils"

/**
 * Popup that displays assigned labels and allows changing them
 */
export class LabelsPopup implements ModalComponent {
	private dom: HTMLElement | null = null
	private isMaxLabelsReached: boolean

	constructor(
		private readonly sourceElement: HTMLElement,
		private readonly origin: PosRect,
		private readonly width: number,
		private readonly labelsForMails: ReadonlyMap<Id, ReadonlyArray<MailFolder>>,
		private readonly labels: { label: MailFolder; state: LabelState }[],
		private readonly onLabelsApplied: (addedLabels: MailFolder[], removedLabels: MailFolder[]) => unknown,
	) {
		this.view = this.view.bind(this)
		this.oncreate = this.oncreate.bind(this)
		this.isMaxLabelsReached = this.checkIsMaxLabelsReached()
	}

	async hideAnimation(): Promise<void> {}

	onClose(): void {
		modal.remove(this)
	}

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
		return m(
			".flex.col.elevated-bg.abs.dropdown-shadow.pt-8.border-radius",
			{
				tabindex: TabIndex.Programmatic,
				role: AriaRole.Menu,
				"data-testid": "dropdown:labels",
			},
			[
				m(
					".pb-8.scroll",
					this.labels
						.sort((labelA, labelB) => labelA.label.name.localeCompare(labelB.label.name))
						.map((labelState) => {
							const { label, state } = labelState
							const color = theme.on_surface_variant
							const canToggleLabel = state === LabelState.Applied || state === LabelState.AppliedToSome || !this.isMaxLabelsReached
							const opacity = !canToggleLabel ? 0.5 : undefined

							return m(
								"label-item.flex.items-center.plr-12.state-bg.cursor-pointer",

								{
									"data-labelid": getElementId(label),
									role: AriaRole.MenuItemCheckbox,
									tabindex: TabIndex.Default,
									"aria-checked": ariaCheckedForState(state),
									"aria-disabled": !canToggleLabel,
									onclick: canToggleLabel ? () => this.toggleLabel(labelState) : noOp,
								},
								[
									m(Icon, {
										icon: this.iconForState(state),
										size: IconSize.PX24,
										style: {
											fill: getLabelColor(label.color),
											opacity,
										},
									}),
									m(".button-height.flex.items-center.ml-12.overflow-hidden", { style: { color, opacity } }, m(".text-ellipsis", label.name)),
								],
							)
						}),
				),
				this.isMaxLabelsReached && m(".small.center.pb-8", lang.get("maximumLabelsPerMailReached_msg")),
				m(BaseButton, {
					label: "apply_action",
					text: lang.get("apply_action"),
					class: "limit-width noselect bg-transparent button-height text-ellipsis content-accent-fg flex items-center plr-8 button-content justify-center border-top state-bg",
					onclick: () => {
						this.applyLabels()
					},
				} satisfies BaseButtonAttrs),
				m(BaseButton, {
					label: "close_alt",
					text: lang.get("close_alt"),
					class: "hidden-until-focus content-accent-fg button-content",
					onclick: () => {
						modal.remove(this)
					},
				}),
			],
		)
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

	private checkIsMaxLabelsReached(): boolean {
		const { addedLabels, removedLabels } = this.getSortedLabels()
		if (addedLabels.length >= MAX_LABELS_PER_MAIL) {
			return true
		}

		for (const [, labels] of this.labelsForMails) {
			const labelsOnMail = new Set<Id>(labels.map((label) => getElementId(label)))

			for (const label of removedLabels) {
				labelsOnMail.delete(getElementId(label))
			}
			if (labelsOnMail.size >= MAX_LABELS_PER_MAIL) {
				return true
			}

			for (const label of addedLabels) {
				labelsOnMail.add(getElementId(label))
				if (labelsOnMail.size >= MAX_LABELS_PER_MAIL) {
					return true
				}
			}
		}

		return false
	}

	private getSortedLabels(): Record<"addedLabels" | "removedLabels", MailFolder[]> {
		const removedLabels: MailFolder[] = []
		const addedLabels: MailFolder[] = []
		for (const { label, state } of this.labels) {
			if (state === LabelState.Applied) {
				addedLabels.push(label)
			} else if (state === LabelState.NotApplied) {
				removedLabels.push(label)
			}
		}
		return { addedLabels, removedLabels }
	}

	private applyLabels() {
		const { addedLabels, removedLabels } = this.getSortedLabels()
		this.onLabelsApplied(addedLabels, removedLabels)
		modal.remove(this)
	}

	oncreate(vnode: VnodeDOM) {
		this.dom = vnode.dom as HTMLElement

		// restrict label height to showing maximum 6 labels to avoid overflow
		const displayedLabels = Math.min(this.labels.length, 6)
		const height = (displayedLabels + 1) * component_size.button_height + size.spacing_8 * 2
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
		switch (labelState.state) {
			case LabelState.AppliedToSome:
				labelState.state = this.isMaxLabelsReached ? LabelState.NotApplied : LabelState.Applied
				break
			case LabelState.NotApplied:
				labelState.state = LabelState.Applied
				break
			case LabelState.Applied:
				labelState.state = LabelState.NotApplied
				break
		}

		this.isMaxLabelsReached = this.checkIsMaxLabelsReached()
	}
}

function ariaCheckedForState(state: LabelState): string {
	switch (state) {
		case LabelState.Applied:
			return "true"
		case LabelState.AppliedToSome:
			return "mixed"
		case LabelState.NotApplied:
			return "false"
	}
}
