import o from "@tutao/otest"
import { ServerModelInfo, typeModels } from "../../../../src/common/api/common/EntityFunctions"
import fs from "node:fs"
import { assertNotNull } from "@tutao/tutanota-utils"
import { TypeModel } from "../../../../src/common/api/common/EntityTypes"
import { AppName, AppNameEnum } from "@tutao/tutanota-utils/dist/TypeRef"

o.spec("EntityFunctionsTest", function () {
	o.spec("parsing current json file as server typeModel", function () {
		o("parse current file", async () => {
			const filePath = "../../tutanota-next/admin/src/db/generated/models.js"
			let fileContent = fs.readFileSync(filePath, { encoding: "utf-8" })
			const jsonContent = fileContent.substring("export default".length, fileContent.length)

			ServerModelInfo.init(31, jsonContent)

			for (const appName of Object.values(AppNameEnum)) {
				o(ServerModelInfo.getCurrentVersion()).equals(31)

				const filteredBaseTypes = filterTypeModel(appName, ServerModelInfo.typeModels[appName])
				verboseTypemodelCompare(appName)
				o(filteredBaseTypes).deepEquals(assertNotNull(typeModels[appName]))(`type model does not match for app: ${appName}`)
			}
		})
	})
})

function filterTypeModel(appName: AppName, map: Map<any, any>): Record<any, any> {
	let obj = {}
	const exportedTypes = JSON.parse(fs.readFileSync("../../tutanota-next/helpers/codegen/tutanota-types.json", { encoding: "utf-8" }))
		.TutanotaTypes as Array<string>
	for (const [key, value] of map.entries()) {
		const maybeExportedType = `${appName}/${value.name}`
		if (exportedTypes.some((t) => t === maybeExportedType)) {
			Object.assign(obj, { [key]: value })
		}
	}
	return obj
}

// same as comparing the whole typeModel but useful to debug test
function verboseTypemodelCompare(appname: AppName) {
	const filteredTypes = filterTypeModel(appname, ServerModelInfo.typeModels[appname])
	for (const [typeId, expectedTypeInfoR] of Object.entries(typeModels[appname])) {
		const expectedTypeInfo = expectedTypeInfoR as Record<string, TypeModel>
		const typeModel = assertNotNull(filteredTypes[typeId], `typeId ${typeId} does not exists`)

		for (const metaKey of Object.keys(typeModel)) {
			if (metaKey === "associations" || metaKey === "values") {
				for (const [fieldId, fieldInfo] of Object.entries(typeModel[metaKey])) {
					const expectedFieldInfo = assertNotNull(expectedTypeInfo[metaKey][fieldId.toString()], `fieldId ${fieldId} does not exists`)
					o(fieldInfo).deepEquals(expectedFieldInfo)
				}
			} else {
				o(assertNotNull(typeModel[metaKey])).deepEquals(expectedTypeInfo[metaKey])(`key ${metaKey} does not match for type: ${typeModel.name}`)
			}
		}
	}
}
