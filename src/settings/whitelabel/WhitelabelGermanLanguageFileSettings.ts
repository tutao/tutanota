import stream from "mithril/stream/stream.js"
import m from "mithril"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
export type GermanLanguageCode = "de" | "de_sie"
export type WhitelabelGermanLanguageFileSettingsAttrs = {
    customGermanLanguageFile: GermanLanguageCode | null
    onGermanLanguageFileChanged: (arg0: GermanLanguageCode) => unknown
}
export class WhitelabelGermanLanguageFileSettings implements Component<WhitelabelGermanLanguageFileSettingsAttrs> {
    constructor(vnode: Vnode<WhitelabelGermanLanguageFileSettingsAttrs>) {}

    view(vnode: Vnode<WhitelabelGermanLanguageFileSettingsAttrs>): Children {
        const {customGermanLanguageFile, onGermanLanguageFileChanged} = vnode.attrs
        return this._renderDefaultGermanLanguageFileSettings(customGermanLanguageFile, onGermanLanguageFileChanged)
    }

    _renderDefaultGermanLanguageFileSettings(
        customGermanLanguageFile: GermanLanguageCode | null,
        onGermanLanguageFileChanged: (arg0: GermanLanguageCode) => unknown,
    ): Children {
        const items = [
            {
                name: "Deutsch (Du)",
                value: "de",
            },
            {
                name: "Deutsch (Sie)",
                value: "de_sie",
            },
        ]
        const selectedValue = customGermanLanguageFile ? customGermanLanguageFile : items[0].value
        const defaultGermanLanguageFileDropDownAttrs = {
            label: "germanLanguageFile_label",
            items,
            selectedValue: stream(selectedValue),
            selectionChangedHandler: onGermanLanguageFileChanged,
        }
        return m(DropDownSelectorN, defaultGermanLanguageFileDropDownAttrs)
    }
}