// @flow
import m from "mithril"
import type {SettingsSection, SettingsValue} from "./SettingsModel"
import {lang} from "../../misc/LanguageViewModel"

export type DetailsColumnViewerAttrs = {
	section: SettingsSection,
	searchValue: string
}

/**
 * render the current selected section settings
 */
export class DetailsColumnViewer implements MComponent<DetailsColumnViewerAttrs> {

	/**
	 * @returns true if the currently rendering setting includes the search value
	 */
	isEqualToSearchValue(setting: SettingsValue<any>, value: string): boolean {
		let result = false
		if(value && value !== "") {
			if (setting.attrs.label) {
				result = lang.get(setting.attrs.label).toLowerCase().includes(value.toLowerCase())
			} else if (lang.get(setting.attrs.tableHeading)) {
				result = lang.get(setting.attrs.tableHeading).toLowerCase().includes(value.toLowerCase())
			}
		}
		return result
	}

	view(vnode: Vnode<DetailsColumnViewerAttrs>): Children {
		const {section, searchValue} = vnode.attrs
		return m(".fill-absolute.scroll.plr-l.pb-floating", [
			section.settingsValues.map(value => {
				return m(".mt-l" + (this.isEqualToSearchValue(value, searchValue) ? ".elevated-bg" : ""), [
					m(value.component, value.attrs)
				])
			})
		])
	}
}

