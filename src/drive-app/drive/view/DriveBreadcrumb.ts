import m, { Children, Component, Vnode } from "mithril"
import { DriveFolderType, SpecialFolderType } from "./DriveViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { getElementId, getListId } from "../../../common/api/common/utils/EntityUtils"
import { pureComponent } from "../../../common/gui/base/PureComponent"

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

const BreadcrumbButton = pureComponent<{ label: Translation; href: string }>(({ label, href }) => {
	return m(
		m.route.Link,
		{
			href,
			selector: "a.noselect.click.plr-button.no-text-decoration",
			"data-testid": `btn:${lang.getTestId(label)}`,
			// FIXME: some aria attrs
		},
		label.text,
	)
})

export class DriveBreadcrumb implements Component<DriveBreadcrumbAttrs> {
	view({ attrs: { currentFolder, parents, onNavigateToFolder } }: Vnode<DriveBreadcrumbAttrs>): Children {
		return m("div.flex.items-center", [
			parents
				.map((entry, index) => [
					// if it's the first item and it has a parent it means we don't have the full path
					// TODO: the ellipsis button should be clickable too
					index === 0 && entry.parent ? [m(".plr", "…"), m(".plr", "/")] : null,
					m(BreadcrumbButton, {
						label: lang.makeTranslation(`nav:${entry.name}`, folderName(entry)),
						href: `/drive/${getListId(entry)}/${getElementId(entry)}`,
					}),
					m(".plr", "/"),
				])
				.flat(),
			currentFolder ? [m(".plr-button", " " + folderName(currentFolder))] : null,
		])
	}
}

function folderName(folder: DriveFolder): string {
	switch (folder.type) {
		case DriveFolderType.Root:
			// FIXME
			return "Home"
		case DriveFolderType.Trash:
			// FIXME
			return "Trash"
		default:
			return folder.name
	}
}
