import m, { Children, Component, Vnode } from "mithril"
import { DriveFolderType, SpecialFolderType } from "./DriveViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"

export interface DriveBreadcrumbAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	onNavigateToFolder: (folder: DriveFolder) => unknown
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
	view({ attrs: { currentFolder, parents, onNavigateToFolder } }: Vnode<DriveBreadcrumbAttrs>): Children {
		// FIXME not pretty
		return m("div", [
			parents
				.map((entry, index) => [
					index === 0 ? null : m("span.plr", "/"),
					m(
						"span",
						{
							onclick: () => {
								onNavigateToFolder(entry)
							},
							class: "cursor-pointer",
						},
						entry.name,
					),
				])
				.flat(),
			currentFolder ? m("span", " " + folderName(currentFolder)) : null,
		])
	}
}

function folderName(folder: DriveFolder): string {
	switch (folder.type) {
		case DriveFolderType.Root:
			return "/"
		case DriveFolderType.Trash:
			// FIXME
			return "Trash"
		default:
			return folder.name
	}
}
