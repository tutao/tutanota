// @flow

import m from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {ButtonColors, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Icons} from "../../gui/base/icons/Icons"

export function renderCalendarSwitchLeftButton(label: TranslationKey, switcher: Function): Child {
	return m(ButtonN, {
		label: label,
		icon: () => Icons.ArrowDropLeft,
		type: ButtonType.ActionLarge,
		colors: ButtonColors.DrawerNav,
		click: switcher
	})
}

export function renderCalendarSwitchRightButton(label: TranslationKey, switcher: Function): Child {
	return m(ButtonN, {
		label: label,
		icon: () => Icons.ArrowDropRight,
		type: ButtonType.ActionLarge,
		colors: ButtonColors.DrawerNav,
		click: switcher
	})
}


