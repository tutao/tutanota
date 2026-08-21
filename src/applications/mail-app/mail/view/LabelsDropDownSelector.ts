import m, { Children, ClassComponent, Vnode, VnodeDOM } from "mithril"
import { Icon, IconSize } from "../../../../ui/base/Icon.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel.js"
import { TextField, TextFieldAttrs } from "../../../../ui/base/TextField"
import { IconButton } from "../../../../ui/base/IconButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { MAX_LABELS_PER_MAIL, TabIndex } from "@tutao/app-env"
import { AriaRole } from "../../../../ui/AriaUtils"
import { getElementId } from "@tutao/meta"
import { getLabelColor } from "../../../../ui/base/Label"
import { BaseButton } from "../../../../ui/base/buttons/BaseButton"
import { modal, ModalComponent } from "../../../../ui/base/Modal"
import { PosRect } from "../../../../ui/utils/PosRect"
import { MailSet } from "@tutao/entities/tutanota"
import { focusNext, focusPrevious, Shortcut } from "../../../../ui/utils/KeyManager"
import { component_size, size } from "../../../../ui/size"
import { showDropdown } from "../../../../ui/base/Dropdown"
import { Keys } from "../../../../ui/utils/KeyboardKeys"
import { Styles } from "../../../../ui/styles"
import { assertNotNull } from "@tutao/utils"

interface AssignedLabel {
	name: string
	value: MailSet
	applied: boolean
}

export interface LabelsDropDownSelectorAttrs {
	label: TranslationKey
	items: AssignedLabel[]
	icon: TextFieldAttrs["leadingIcon"]
	onLabelsApplied: (addedLabels: MailSet[]) => unknown
}

/**
 * DropDown that displays labels and allows selecting them
 */
export class LabelsDropDownSelector implements ClassComponent<LabelsDropDownSelectorAttrs> {
	private selectorDom: HTMLElement | null = null

	view({ attrs }: Vnode<LabelsDropDownSelectorAttrs>): Children {
		return m(TextField, {
			value: lang.getTranslationText(attrs.label),
			isReadOnly: true,
			onclick: () => this.showDropdown(attrs),
			onDomWrapperCreated: (dom) => {
				this.selectorDom = dom
			},
			class: "click ",
			leadingIcon: attrs.icon,
			injectionsRight: () =>
				m(
					".flex.items-center.justify-center",
					{ style: { width: "30px", height: "30px" } },
					m(IconButton, {
						icon: Icons.ArrowDown,
						label: "show_action",
						click: () => this.showDropdown(attrs),
						size: ButtonSize.Compact,
					}),
				),
			doShowBorder: true,
		})
	}

	private showDropdown(attrs: LabelsDropDownSelectorAttrs) {
		const dom = assertNotNull(this.selectorDom)
		new LabelsDropdown(dom, dom.getBoundingClientRect(), Styles.get().isDesktopLayout() ? 300 : 200, attrs.items, async (addedLabels) => {
			attrs.onLabelsApplied(addedLabels)
		}).show()
	}
}

class LabelsDropdown implements ModalComponent {
	private dom: HTMLElement | null = null

	constructor(
		private readonly sourceElement: HTMLElement,
		private readonly origin: PosRect,
		private readonly width: number,
		private readonly items: AssignedLabel[],
		private readonly onLabelsApplied: (addedLabels: MailSet[]) => unknown,
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
					{
						// this shouldn't be needed, but without it the width gets too large
						style: {
							width: `${this.width}px`,
						},
					},
					this.items.map((labelState) => {
						const { name, value, applied } = labelState
						const canToggleLabel = applied || !this.isLabelLimitReached()
						const opacity = !canToggleLabel ? 0.5 : undefined

						return m(
							"label-item.flex.items-center.plr-12.state-bg.cursor-pointer",

							{
								"data-labelid": getElementId(value),
								role: AriaRole.MenuItemCheckbox,
								tabindex: TabIndex.Default,
								"aria-checked": applied,
								"aria-disabled": !canToggleLabel,
								onclick: () => {
									this.toggleLabelState(labelState)
								},
							},
							[
								m(Icon, {
									icon: this.iconForState(applied),
									size: IconSize.PX24,
									style: {
										fill: getLabelColor(value.color),
										opacity,
									},
								}),
								m(
									".button-height.flex.items-center.ml-12.overflow-hidden",
									{
										style: {
											opacity,
										},
									},
									m(
										".text-ellipsis",
										{
											title: name,
										},
										name,
									),
								),
							],
						)
					}),
				),
				this.isLabelLimitReached() ? m(".small.center.pb-8", lang.getTranslationText("maximumLabelsPerMailReached_msg")) : null,
				m(BaseButton, {
					label: "apply_action",
					text: lang.getTranslationText("apply_action"),
					class: "limit-width noselect bg-transparent button-height text-ellipsis content-accent-fg flex items-center plr-8 button-content justify-center border-top state-bg",
					onclick: () => {
						this.applyLabels()
					},
				}),
				m(BaseButton, {
					label: "close_alt",
					text: lang.getTranslationText("close_alt"),
					class: "hidden-until-focus content-accent-fg button-content",
					onclick: () => {
						modal.remove(this)
					},
				}),
			],
		)
	}

	private iconForState(applied: boolean): Icons {
		return applied ? Icons.LabelFilled : Icons.LabelOutline
	}

	private appliedLabels() {
		return this.items.filter((item) => item.applied)
	}

	private applyLabels() {
		this.onLabelsApplied(this.appliedLabels().map((labels) => labels.value))
		modal.remove(this)
	}

	private isLabelLimitReached() {
		return this.appliedLabels().length >= MAX_LABELS_PER_MAIL
	}

	private toggleLabelState(labelState: AssignedLabel) {
		if (labelState.applied || !this.isLabelLimitReached()) labelState.applied = !labelState.applied
	}

	oncreate(vnode: VnodeDOM) {
		this.dom = vnode.dom as HTMLElement

		// restrict label height to showing maximum 6 labels to avoid overflow
		const displayedLabels = Math.min(this.items.length, 6)
		const height = (displayedLabels + 1) * component_size.button_height + size.spacing_8 * 2
		showDropdown(this.origin, this.dom, height, this.width, "top", false).then(() => {
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
					const labelState = this.items.find((item) => labelId === getElementId(item.value))
					if (labelState) {
						this.toggleLabelState(labelState)
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
}
