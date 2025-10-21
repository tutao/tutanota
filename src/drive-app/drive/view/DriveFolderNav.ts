import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumb } from "./DriveBreadcrumb"
import { DriveViewModel } from "./DriveViewModel"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"

export interface DriveFolderNavAttrs {
	onUploadClick: (dom: HTMLElement) => void
	driveViewModel: DriveViewModel
}

const driveFolderNavStyle = {
	background: "white",
	height: "52px",
	display: "flex",
	padding: "4px 24px",
	"border-radius": "10px",
	width: "955px",
	"align-items": "center",
	"justify-content": "space-between",
}

export class DriveFolderNav implements Component<DriveFolderNavAttrs> {
	view(vnode: Vnode<DriveFolderNavAttrs>): Children {
		const driveViewModel = vnode.attrs.driveViewModel

		return m(
			"",
			{ style: driveFolderNavStyle },
			// TODO: FilterBox
			m(DriveBreadcrumb, { driveViewModel, path: [["root", ["SomeListID", "SomeElementID"]]] }), // FIXME: hardcoded path
			driveViewModel.currentFolder.isVirtual
				? null
				: m("", [
						m(IconButton, {
							title: lang.makeTranslation("Upload file", () => "Upload file"),
							click: (ev, dom) => vnode.attrs.onUploadClick(dom),
							icon: Icons.Upload,
						}),
					]),
		)
	}
}
