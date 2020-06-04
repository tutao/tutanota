// @flow
import o from "ospec"
import n from "../nodemocker"
import {DesktopContextMenu} from "../../../src/desktop/DesktopContextMenu"
import {downcast} from "../../../src/api/common/utils/Utils"

o.spec("DesktopContextMenu Test", () => {
	const standardMocks = () => {
		// node modules
		const electron = {
			clipboard: {
				writeText: () => {}
			},
			Menu: n.classify({
				prototype: {
					append: function () {},
					popup: function () {},
				},
				statics: {}
			}),
			MenuItem: n.classify({
				prototype: {
					enabled: true,
					constructor: function (p) {
						Object.assign(this, p)
					}
				},
				statics: {}
			})
		}

		const ipc = {

		}

		const electronMock: $Exports<"electron"> = n.mock('electron', electron).set()
		const ipcMock = n.mock('__ipc', ipc).set()

		return {
			electronMock,
			ipcMock,
		}
	}

	o("can handle undefined browserWindow and webContents in callback", () => {
		const {electronMock, ipcMock} = standardMocks()
		const contextMenu = new DesktopContextMenu(electronMock, ipcMock)
		contextMenu.open({
			linkURL: "nourl",
			editFlags: {
				canCut: false,
				canPaste: false,
				canCopy: false,
				canUndo: false,
				canRedo: false
			},
			dictionarySuggestions: [],
			misspelledWord: ""
		})
		downcast(electronMock.MenuItem).mockedInstances.forEach(i => i.click && i.click(undefined, undefined))
		downcast(electronMock.MenuItem).mockedInstances.forEach(i => i.click && i.click(undefined, "nowebcontents"))
	})
})