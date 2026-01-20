import m, { Children, VnodeDOM } from "mithril"
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js"
import { focusNext, focusPrevious, Shortcut } from "../../../common/misc/KeyManager.js"
import { BaseButton, BaseButtonAttrs } from "../../../common/gui/base/buttons/BaseButton.js"
import { PosRect, showDropdown } from "../../../common/gui/base/Dropdown.js"
import { MailSet } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { component_size, size } from "../../../common/gui/size.js"
import { AllIcons, Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { theme } from "../../../common/gui/theme.js"
import { Keys, TabIndex } from "../../../common/api/common/TutanotaConstants.js"
import { getElementId } from "../../../common/api/common/utils/EntityUtils.js"
import { getLabelColor } from "../../../common/gui/base/Label.js"
import { LabelState } from "../model/MailModel.js"
import { AriaRole } from "../../../common/gui/AriaUtils.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { noOp } from "@tutao/tutanota-utils"
import { LabelsPopupViewModel } from "./LabelsPopupViewModel"

/**
 * Popup that displays assigned labels and allows changing them
 */
export class LabelsPopup implements ModalComponent {
	private dom: HTMLElement | null = null

	constructor(
		private readonly sourceElement: HTMLElement,
		private readonly origin: PosRect,
		private readonly width: number,
		private readonly viewModel: LabelsPopupViewModel,
		private readonly onLabelsApplied: (addedLabels: MailSet[], removedLabels: MailSet[]) => unknown,
	) {
		this.view = this.view.bind(this)
		this.oncreate = this.oncreate.bind(this)
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
					this.viewModel.getLabelState().map((labelState) => {
						const { label, state } = labelState
						const color = theme.on_surface
						const canToggleLabel = state === LabelState.Applied || state === LabelState.AppliedToSome || !this.viewModel.isLabelLimitReached()
						const opacity = !canToggleLabel ? 0.5 : undefined

						return m(
							"label-item.flex.items-center.plr-12.state-bg.cursor-pointer",

							{
								"data-labelid": getElementId(label),
								role: AriaRole.MenuItemCheckbox,
								tabindex: TabIndex.Default,
								"aria-checked": ariaCheckedForState(state),
								"aria-disabled": !canToggleLabel,
								onclick: canToggleLabel ? () => this.viewModel.toggleLabel(label) : noOp,
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
								m(
									".button-height.flex.items-center.ml-12.overflow-hidden",
									{
										style: {
											color,
											opacity,
										},
									},
									m(".text-ellipsis", label.name),
								),
							],
						)
					}),
				),
				this.viewModel.isLabelLimitReached() ? m(".small.center.pb-8", lang.get("maximumLabelsPerMailReached_msg")) : null,
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

	private applyLabels() {
		const { addedLabels, removedLabels } = this.viewModel.getLabelStateChange()
		this.onLabelsApplied(addedLabels, removedLabels)
		modal.remove(this)
	}

	oncreate(vnode: VnodeDOM) {
		this.dom = vnode.dom as HTMLElement

		// restrict label height to showing maximum 6 labels to avoid overflow
		const displayedLabels = Math.min(this.viewModel.getLabelState().length, 6)
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
					this.viewModel.toggleLabelById(labelId)
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
