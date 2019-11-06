// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InputFieldType} from "../api/common/TutanotaConstants"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {Table} from "../gui/base/Table"

import {createInputField} from "../api/entities/tutanota/InputField"
import {createName} from "../api/entities/tutanota/Name"
import {Button} from "../gui/base/Button"
import TableLine from "../gui/base/TableLine"
import {remove} from "../api/common/utils/ArrayUtils"
import {Icons} from "../gui/base/icons/Icons"
import {defer} from "../api/common/utils/Utils"
import stream from "mithril/stream/stream.js"
import {ColumnWidth} from "../gui/base/TableN"

assertMainOrNode()

export function show(): Promise<?InputField> {
	let nameField = new TextField("name_label")
	let types = [
		{name: lang.get("text_label"), value: InputFieldType.TEXT},
		{name: lang.get("number_label"), value: InputFieldType.NUMBER},
		{name: lang.get("enum_label"), value: InputFieldType.ENUM}
	]
	let typeField = new DropDownSelector("type_label", null, types, stream(types[0].value))

	let addButton = new Button("addEnumValue_action", () => {
		Dialog.showTextInputDialog("addEnumValue_action", "enumValue_label", null, "", newName => {
			return (newName.trim() === "") ? "pleaseEnterEnumValues_msg" : null
		}).then(name => {
			enumNames.push(name)
			_updateEnumTable(enumTable, enumNames)
		})
	}, () => Icons.Add)
	let enumNames: string[] = []
	let enumTable = new Table(["enumValue_label"], [ColumnWidth.Largest], true, addButton)
	_updateEnumTable(enumTable, enumNames)

	let form = {
		view: () => {
			return m("", [
				m(nameField),
				m(typeField),
				(typeField.selectedValue() === InputFieldType.ENUM) ? m(enumTable) : null
			])
		}
	}


	const {resolve, promise} = defer()

	const addStatisticsFieldOkAction = (dialog) => {
		let f = createInputField()
		f.name = nameField.value()
		f.type = typeField.selectedValue()
		if (typeField.selectedValue() === InputFieldType.ENUM) {
			f.enumValues = enumNames.map(name => {
				let n = createName()
				n.name = name
				return n
			})
		}
		dialog.close()
		resolve(f)
	}

	Dialog.showActionDialog({
		title: lang.get("addStatisticsField_action"),
		child: form,
		validator: () => _validate(nameField.value(), typeField.selectedValue(), enumNames),
		okAction: addStatisticsFieldOkAction,
		cancelAction: () => resolve(null)
	})

	return promise
}

function _updateEnumTable(enumTable: Table, enumNames: string[]) {
	enumTable.updateEntries(enumNames.map(n => {
		let deleteButton = new Button("delete_action", () => {
			remove(enumNames, n)
			_updateEnumTable(enumTable, enumNames)
		}, () => Icons.Cancel)
		return new TableLine([n], deleteButton)
	}))
}

function _validate(name: string, type: NumberString, enumNames: string[]) {
	if (name.trim() === "") {
		return "enterName_msg"
	} else if (type === InputFieldType.ENUM && enumNames.length < 2) {
		return "pleaseEnterEnumValues_msg"
	}
}
