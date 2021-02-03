// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {InputFieldType} from "../api/common/TutanotaConstants"

import {createInputField} from "../api/entities/tutanota/InputField"
import {createName} from "../api/entities/tutanota/Name"
import {remove} from "../api/common/utils/ArrayUtils"
import {Icons} from "../gui/base/icons/Icons"
import {defer} from "../api/common/utils/Utils"
import stream from "mithril/stream/stream.js"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import type {InputField} from "../api/entities/tutanota/InputField"
import {TextFieldN} from "../gui/base/TextFieldN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"

assertMainOrNode()

export function show(): Promise<?InputField> {
	const name = stream("")
	const types = [
		{name: lang.get("text_label"), value: InputFieldType.TEXT},
		{name: lang.get("number_label"), value: InputFieldType.NUMBER},
		{name: lang.get("enum_label"), value: InputFieldType.ENUM}
	]
	const selectedType = stream(types[0].value)
	const enumNames = []
	const addButtonClicked = () => {
		Dialog.showTextInputDialog("addEnumValue_action", "enumValue_label", null, "", newName => {
			return (newName.trim() === "") ? "pleaseEnterEnumValues_msg" : null
		}).then(name => {
			enumNames.push(name)
		})
	}
	let form = {
		view: () => {
			return m("", [
				m(TextFieldN, {
					label: "name_label",
					value: name,
				}),
				m(DropDownSelectorN, {
					label: "type_label",
					items: types,
					selectedValue: selectedType
				}),
				selectedType() === InputFieldType.ENUM
					? m(TableN, {
						columnHeadings: ["enumValue_label"],
						columnWidths: [ColumnWidth.Largest],
						showActionButtonColumn: true,
						addButtonAttrs: {
							label: "addEnumValue_action",
							click: addButtonClicked,
							icon: () => Icons.Add
						},
						lines: enumNames.map(name => {
							return {
								cells: [name],
								actionButtonAttrs: {
									label: "delete_action",
									click: () => remove(enumNames, name),
									icon: () => Icons.Cancel
								}
							}
						})
					})
					: null
			])
		}
	}


	const {resolve, promise} = defer()

	const addStatisticsFieldOkAction = (dialog) => {
		let f = createInputField()
		f.name = name()
		f.type = selectedType()
		if (selectedType() === InputFieldType.ENUM) {
			f.enumValues = enumNames.map(name => createName({name: name}))
		}
		dialog.close()
		resolve(f)
	}

	Dialog.showActionDialog({
		title: lang.get("addStatisticsField_action"),
		child: form,
		validator: () => _validate(name(), selectedType(), enumNames),
		okAction: addStatisticsFieldOkAction,
		cancelAction: () => resolve(null)
	})

	return promise
}

function _validate(name: string, type: NumberString, enumNames: string[]): ?TranslationKey {
	if (name.trim() === "") {
		return "enterName_msg"
	} else if (type === InputFieldType.ENUM && enumNames.length < 2) {
		return "pleaseEnterEnumValues_msg"
	}
}
