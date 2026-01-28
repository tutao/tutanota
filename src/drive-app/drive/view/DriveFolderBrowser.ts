import m, { Children, Component, Vnode } from "mithril"
import { getElementId } from "../../../common/api/common/utils/EntityUtils"
import { DriveFolderBrowserEntry, DriveFolderBrowserEntryAttrs } from "./DriveFolderBrowserEntry"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton"
import { theme } from "../../../common/gui/theme"
import { LoginTextField } from "../../../common/gui/base/LoginTextField"
import { FolderItem, folderItemEntity } from "./DriveUtils"
import { isEmpty } from "@tutao/tutanota-utils"
import { lang } from "../../../common/misc/LanguageViewModel"

export interface DriveMiniFolderContentAttrs {
	items: readonly FolderItem[]
	onItemClicked: (f: FolderItem) => unknown
	style?: Record<string, unknown>
	newFolder: DriveFolderBrowserNewFolderEntryAttrs | null
}

export class DriveFolderBrowser implements Component<DriveMiniFolderContentAttrs> {
	view({ attrs: { items, onItemClicked, style, newFolder } }: Vnode<DriveMiniFolderContentAttrs>): Children {
		return m(
			".flex.col.gap-4.scroll",
			{
				style,
				role: "list",
			},
			newFolder == null ? null : m(DriveFolderBrowserNewFolderEntry, newFolder),
			isEmpty(items)
				? m(
						".text-center.h2.pt-32.pb-32.font-weight-500.translucent",
						{ "data-testid": lang.getTestId("folderIsEmpty_msg") },
						lang.getTranslationText("folderIsEmpty_msg"),
					)
				: items.map((item) =>
						m(DriveFolderBrowserEntry, {
							key: getElementId(folderItemEntity(item)),
							item: item,
							selected: false,
							onSingleSelection: onItemClicked,
						} satisfies DriveFolderBrowserEntryAttrs & { key: string }),
					),
		)
	}
}

interface DriveFolderBrowserNewFolderEntryAttrs {
	newFolderName: string
	onNewFolderNameInput: (name: string) => unknown
	onCreateFolder: () => unknown
}

class DriveFolderBrowserNewFolderEntry implements Component<DriveFolderBrowserNewFolderEntryAttrs> {
	view({ attrs: { newFolderName, onNewFolderNameInput, onCreateFolder } }: Vnode<DriveFolderBrowserNewFolderEntryAttrs>): Children {
		return m(
			".flex.row.folder-row.items-center.plr-12.pt-16.pb-16.gap-12",
			{
				style: {
					background: theme.surface,
					"border-radius": "10px",
				},
			},
			[
				m(LoginTextField, {
					class: "flex-grow",
					label: "folderName_label",
					value: newFolderName,
					oninput: onNewFolderNameInput,
					onReturnKeyPressed: onCreateFolder,
					onDomInputCreated: (dom) => dom.focus(),
				}),
				m(LoginButton, {
					label: "createFolder_action",
					width: "flex",
					onclick: onCreateFolder,
				}),
			],
		)
	}
}
