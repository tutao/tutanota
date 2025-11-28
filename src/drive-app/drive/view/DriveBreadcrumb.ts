import m, { Children, Component, Vnode } from "mithril"
import { DriveFolderType, DriveViewModel, SpecialFolderType } from "./DriveViewModel"

export type BreadcrumbPath = Array<[string, IdTuple]>

export interface DriveBreadcrumbAttrs {
	path: BreadcrumbPath
}

export function getSpecialFolderName(specialFolder: SpecialFolderType) {
	// FIXME: Move this to a better place.
	switch (specialFolder) {
		case DriveFolderType.Root:
			return "Root"
		case DriveFolderType.Trash:
			return "Trash"
	}
}

export class DriveBreadcrumb implements Component<DriveBreadcrumbAttrs> {
	view({ attrs }: Vnode<DriveBreadcrumbAttrs>): Children {
		// let parents = driveViewModel.getCurrentParents()

		return m(
			"div",
			// parents
			// 	.map((entry, index) => [
			// 		index === 0 ? null : m("span.plr", "/"),
			// 		m(
			// 			"span",
			// 			{
			// 				onclick: () => {
			// 					driveViewModel.navigateToFolder(entry.folder)
			// 				},
			// 				class: "cursor-pointer",
			// 			},
			// 			entry.folderName,
			// 		),
			// 	])
			// 	.flat(),
		)
	}
}
