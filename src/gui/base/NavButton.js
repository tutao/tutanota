// @flow
import m from "mithril"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import {lang} from "../../misc/LanguageViewModel"
import {size} from "../size"
import {flash} from "./Ripple"
import {neverNull} from "../../api/common/utils/Utils"
import {Icon} from "./Icon"
import {ButtonColors, getColors} from "./Button"
import type {ButtonColorEnum} from "./Button"

const TRUE_CLOSURE = (): lazy<boolean> => true

export class NavButton {
	icon: lazy<SVG>;
	href: string|lazy<string>;
	clickHandler: ?clickHandler;

	isVisible: lazy<boolean>;
	isSelected: lazy<boolean>;
	_isSelectedPrefix: ?string;
	getLabel: lazy<string>;
	_domButton: HTMLElement;
	view: Function;
	_draggedOver: boolean;
	_dropHandler: ?dropHandler;
	_dropCounter: number; // we also get drag enter/leave events from subelements, so we need to count to know when the drag leaves this button
	_colors: ButtonColorEnum;


	constructor(label: string|lazy<string>, icon: lazy<SVG>, href: string|Function, isSelectedPrefix: ?string) {
		this.icon = icon
		this.href = href
		this.clickHandler = null
		this._isSelectedPrefix = isSelectedPrefix
		this._colors = ButtonColors.Content
		this.isVisible = TRUE_CLOSURE
		this._draggedOver = false
		this.isSelected = () => {
			if (this._isSelectedPrefix) {
				let current = m.route.get()
				return this._isSelectedPrefix && (current == this._isSelectedPrefix || (current.indexOf(this._isSelectedPrefix + "/") === 0))
			}
			return false
		}
		this.getLabel = label instanceof Function ? label : lang.get.bind(lang, label)

		this._dropCounter = 0

		this.view = (): VirtualElement => {
			// allow nav button without label for registration button on mobile devices
			return m("a.nav-button.noselect.flex-start.flex-fixed.items-center.click.plr-button.no-text-decoration.button-height", this.createButtonAttributes(), [
				this.icon() ? m(Icon, {
						icon: this.icon(),
						class: 'flex-center items-center button-icon ' + (this.isSelected() ? "selected" : ""),
						style: {
							fill: (this.isSelected() || this._draggedOver) ? getColors(this._colors).icon_selected : getColors(this._colors).icon,
							'background-color': (this.isSelected() || this._draggedOver) ? getColors(this._colors).button_selected : getColors(this._colors).button
						}
					}) : null,
				this.getLabel().length > 0 ? m("span.label.click.text-ellipsis.pl-m.b", this.getLabel()) : null
			])
		}
	}

	_getUrl(): string {
		return (this.href instanceof Function) ? this.href() : this.href
	}

	_isExternalUrl() {
		let url = this._getUrl()
		return url != null ? url.indexOf("http") == 0 : false
	}

	createButtonAttributes() {
		let attr: any = {
			href: this._getUrl(),
			style: {color: (this.isSelected() || this._draggedOver) ? getColors(this._colors).button_selected : getColors(this._colors).button},
			title: this.getLabel(),
			target: this._isExternalUrl() ? "_blank" : undefined,
			oncreate: (vnode: VirtualElement) => {
				this._domButton = vnode.dom
				// route.link adds the appropriate prefix to the href attribute and sets the domButton.onclick handler
				if (!this._isExternalUrl()) {
					m.route.link(vnode)
				}
				this._domButton.onclick = (event: MouseEvent) => this.click(event)
			},
			onupdate: (vnode: VirtualElement) => {
				if (this.href instanceof Function) {
					if (!this._isExternalUrl()) {
						m.route.link(vnode)
					}
					this._domButton.onclick = (event: MouseEvent) => this.click(event)
				}
			}
		}
		if (this._dropHandler) {
			attr.ondragenter = (ev) => {
				this._dropCounter++
				this._draggedOver = true
				ev.preventDefault()
			}
			attr.ondragleave = (ev) => {
				this._dropCounter--
				if (this._dropCounter == 0) {
					this._draggedOver = false
				}
				ev.preventDefault()
			}
			attr.ondragover = (ev) => {
				// needed to allow dropping
				ev.preventDefault()
			}
			attr.ondrop = (ev) => {
				this._dropCounter = 0
				this._draggedOver = false
				ev.preventDefault()
				if (ev.dataTransfer.getData("text")) {
					neverNull(this._dropHandler)(ev.dataTransfer.getData("text"))
				}
			}
		}
		return attr
	}

	setColors(colors: ButtonColorEnum): NavButton {
		this._colors = colors
		return this
	}

	setClickHandler(clickHandler: clickHandler): NavButton {
		this.clickHandler = clickHandler
		return this
	}

	setIsVisibleHandler(clickHandler: clickHandler): NavButton {
		this.isVisible = clickHandler
		return this
	}

	setDropHandler(dropHandler: dropHandler): NavButton {
		this._dropHandler = dropHandler
		return this
	}

	click(event: MouseEvent) {
		if (!this._isExternalUrl()) {
			m.route.set(this._getUrl())
			try {
				flash(this._domButton)
				if (this.clickHandler != null) {
					this.clickHandler(event)
				}
				// in IE the activeElement might not be defined and blur might not exist
				if (document.activeElement && document.activeElement.blur instanceof Function) {
					document.activeElement.blur()
				}
				event.preventDefault()
			} catch (e) {
				handleUncaughtError(e)
			}
		}
	}

	getHeight(): number {
		return size.button_height
	}
}
