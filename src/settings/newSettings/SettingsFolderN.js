// @flow

import type {TranslationKey} from "../../misc/LanguageViewModel"
import type {lazy} from "../../api/common/utils/Utils"
import type {lazyIcon} from "../../gui/base/Icon"
import {isSelectedPrefix} from "../../gui/base/NavButtonN"
import {NEW_SETTINGS_PREFIX} from "../../misc/RouteChange"

export class SettingsFolderN {
	url: string; // can be changed from outside
	+name: TranslationKey | lazy<string>;
	+icon: lazyIcon;

	constructor(name: TranslationKey | lazy<string>, icon: lazyIcon) {
		this.name = name
		this.icon = icon
		this.url = NEW_SETTINGS_PREFIX
	}

	isActive(): boolean {
		return isSelectedPrefix(this.url)
	}

	isVisible(): boolean {
		return true
	}
}