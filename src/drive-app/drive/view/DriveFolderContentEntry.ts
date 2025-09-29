import m, { Children, Component } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { formatStorageSize } from "../../../common/misc/Formatter"
import { generatedIdToTimestamp, getElementId } from "../../../common/api/common/utils/EntityUtils"
import { Checkbox } from "../../../common/gui/base/Checkbox"

export interface DriveFolderContentEntryAttrs {
	file: File
	onSelect: (f: File) => void
	checked: boolean // maybe should be inside a map inside the model
}

export class DriveFolderContentEntry implements Component<DriveFolderContentEntryAttrs> {
	view({ attrs: { file, checked, onSelect } }: m.Vnode<DriveFolderContentEntryAttrs>): Children {
		const uploadDate = new Date(generatedIdToTimestamp(getElementId(file)))

		return m("tr", [
			m("td", m(Checkbox, { label: () => "selected", checked, onChecked: () => onSelect(file) })),
			m("td", file.name),
			m("td", file.mimeType?.split("/")[1]),
			m("td", formatStorageSize(Number(file.size))),
			m("td", uploadDate.toLocaleString()),
			m("td", "actions"),
		])
	}
}
