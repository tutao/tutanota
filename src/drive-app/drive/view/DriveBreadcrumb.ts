import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"

export type BreadcrumbPath = Array<[string, IdTuple]>

export interface DriveBreadcrumbAttrs {
	driveViewModel: DriveViewModel
	path: BreadcrumbPath
}

export class DriveBreadcrumb implements Component<DriveBreadcrumbAttrs> {
	view(vnode: Vnode<DriveBreadcrumbAttrs>): Children {
		// const isRoot = vnode.attrs.driveViewModel.currentFolderIsRoot()
		//
		// return m("div", isRoot ? "/" : `/${vnode.attrs.driveViewModel.getCurrentFolder().name}`)

		const parents = vnode.attrs.driveViewModel.getCurrentParents()
		return m(
			"div",
			parents
				.map((entry, index) => [
					index === 0 ? null : m("span.plr", "/"),
					m(
						"span",
						{
							onclick: () => {
								vnode.attrs.driveViewModel.navigateToFolder(entry.folder)
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
