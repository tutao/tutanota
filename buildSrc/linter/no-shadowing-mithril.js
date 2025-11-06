export default {
	meta: {
		type: "problem",
		docs: {
			description: "rejects declarations with the name 'm' unless it's in a mithril import",
		},
		schema: [],
	},
	create: function (context) {
		return {
			":matches(VariableDeclaration, FunctionDeclaration)": function (node) {
				if (!hasMithrilImport(context, node)) {
					// it's fine to declare m if we don't use mithril in the file
					return
				}
				switch (node.type) {
					case "VariableDeclaration":
						return checkVariableDeclaration(context, node)
					case "FunctionDeclaration":
						return checkFunctionDeclaration(context, node)
				}
			},
		}
	},
}

function hasMithrilImport(context, node) {
	const ancestors = context.sourceCode.getAncestors(node)[0]
	console.log("program", ancestors)
	return false
}

function checkVariableDeclaration(context, node) {
	if (node.declarations.map((d) => d.id.name).some((n) => n === "m")) {
		context.report({
			node,
			message: "declared variable with name 'm' shadowing mithril import",
		})
	}
}

function checkFunctionDeclaration(context, node) {
	if (node.id != null && node.id.name === "m") {
		context.report({
			node,
			message: "declared function with name 'm' shadowing mithril import",
		})
	}
}
