import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel, VirtualFolder } from "./DriveViewModel"

export type BreadcrumbPath = Array<[string, IdTuple]>

export interface DriveBreadcrumbAttrs {
	driveViewModel: DriveViewModel
	path: BreadcrumbPath
}

export function getVirtualFolderName(virtualFolder: VirtualFolder) {
	return virtualFolder.toString()
}

export class DriveBreadcrumb implements Component<DriveBreadcrumbAttrs> {
	view({ attrs: { driveViewModel } }: Vnode<DriveBreadcrumbAttrs>): Children {
		if (driveViewModel.currentFolder.isVirtual) {
			return m("div", getVirtualFolderName(driveViewModel.currentFolder.virtualFolder))
		}

		let parents = driveViewModel.getCurrentParents()

		return m(
			"div",
			parents
				.map((entry, index) => [
					index === 0 ? null : m("span.plr", "/"),
					m(
						"span",
						{
							onclick: () => {
								driveViewModel.navigateToFolder(entry.folder)
							},
							class: "cursor-pointer",
						},
						entry.folderName,
					),
				])
				.flat(),
		)
	}
}
