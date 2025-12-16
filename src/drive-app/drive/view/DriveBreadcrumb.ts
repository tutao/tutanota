import m, { Children, Component, Vnode } from "mithril"
import { DriveFolderType } from "./DriveViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { getElementId, getListId } from "../../../common/api/common/utils/EntityUtils"
import { pureComponent } from "../../../common/gui/base/PureComponent"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { Keys } from "../../../common/api/common/TutanotaConstants"

export interface DriveBreadcrumbAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	onNavigateToFolder: (folder: DriveFolder) => unknown
}

const BreadcrumbLink = pureComponent<{ label: Translation; href: string }>(({ label, href }) => {
	return m(
		m.route.Link,
		{
			href,
			selector: "a.click.no-text-decoration",
			"data-testid": `btn:${lang.getTestId(label)}`,
			// FIXME: some aria attrs
			onkeyup: (e: KeyboardEvent, dom: HTMLElement) => {
				if (isKeyPressed(e.key, Keys.SPACE)) {
					m.route.set(href)
				}
			},
		},
		label.text,
	)
})

export class DriveBreadcrumb implements Component<DriveBreadcrumbAttrs> {
	view({ attrs: { currentFolder, parents, onNavigateToFolder } }: Vnode<DriveBreadcrumbAttrs>): Children {
		return m("div.flex.items-center.column-gap-12", [
			parents
				.map((entry, index) => [
					// if it's the first item and it has a parent it means we don't have the full path
					// TODO: the ellipsis button should be clickable too
					index === 0 && entry.parent ? [m("", "…"), m("", "/")] : null,
					m(BreadcrumbLink, {
						label: lang.makeTranslation(`nav:${entry.name}`, folderName(entry)),
						href: `/drive/${getListId(entry)}/${getElementId(entry)}`,
					}),
					m("", "/"),
				])
				.flat(),
			currentFolder ? [m("", " " + folderName(currentFolder))] : null,
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
