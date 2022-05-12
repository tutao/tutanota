import o from "ospec"
import n from "../nodemocker.js"
import {DesktopContextMenu} from "../../../src/desktop/DesktopContextMenu.js"
import {downcast} from "@tutao/tutanota-utils"
import {IPC} from "../../../src/desktop/IPC.js";
import ContextMenuParams = Electron.ContextMenuParams;

o.spec("DesktopContextMenu Test", () => {
    const standardMocks = () => {
        // node modules
        const electron = {
            clipboard: {
                writeText: () => {},
            },
            Menu: n.classify({
                prototype: {
                    append: function () {},
                    popup: function () {},
                },
                statics: {},
            }),
            MenuItem: n.classify({
                prototype: {
                    enabled: true,
                    constructor: function (p) {
                        Object.assign(this, p)
                    },
                },
                statics: {},
            }),
        }
        const ipc = {}
        const electronMock = n.mock<typeof import("electron")>("electron", electron).set()
        const ipcMock = n.mock<IPC>("__ipc", ipc).set()
        return {
            electronMock,
            ipcMock,
        }
    }

    o("can handle undefined browserWindow and webContents in callback", () => {
        const {electronMock, ipcMock} = standardMocks()
        const contextMenu = new DesktopContextMenu(electronMock, ipcMock)
	    const contextMenuParams: Partial<ContextMenuParams> = {
		    linkURL: "nourl",
		    editFlags: {
			    canCut: false,
			    canPaste: false,
			    canCopy: false,
			    canUndo: false,
			    canRedo: false,
			    canEditRichly: false,
			    canDelete: false,
			    canSelectAll: false,
		    },
		    dictionarySuggestions: [],
		    misspelledWord: ""
	    };
	    contextMenu.open(contextMenuParams as ContextMenuParams)
	    downcast(electronMock.MenuItem).mockedInstances.forEach(i => i.click && i.click(undefined, undefined))
        downcast(electronMock.MenuItem).mockedInstances.forEach(i => i.click && i.click(undefined, "nowebcontents"))
    })
})