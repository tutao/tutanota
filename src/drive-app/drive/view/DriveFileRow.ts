import { VirtualRow } from "../../../common/gui/base/ListUtils"
import { SelectableRowContainer, SelectableRowSelectedSetter } from "../../../common/gui/SelectableRowContainer"
import m, { Children } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"

export class DriveFileRow implements VirtualRow<File> {
	top: number = 0
	domElement: HTMLElement | null = null // set from List
	entity: File | null = null
	private icon!: HTMLElement
	private nameDom!: HTMLElement
	private mimeTypeDom!: HTMLElement
	private fileSizeDom!: HTMLElement
	private dateDom!: HTMLElement

	private selectionUpdater!: SelectableRowSelectedSetter

	constructor() {}

	update(file: File, selected: boolean): void {
		this.entity = file

		this.selectionUpdater(selected, false)

		this.nameDom.textContent = this.entity.name
		this.mimeTypeDom.textContent = this.entity.mimeType
		this.fileSizeDom.textContent = String(this.entity.size) // format later
		this.dateDom.textContent = "???"
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			SelectableRowContainer,
			{
				onSelectedChangeRef: (updater) => (this.selectionUpdater = updater),
			},

			m(".flex.col.flex-grow", [
				m("div", {
					oncreate: (vnode) => (this.nameDom = vnode.dom as HTMLElement),
				}),
			]),
		)
	}
}
