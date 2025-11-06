export default {
	meta: {
		type: "problem",
		docs: {
			description: "enforces the standard convention for importing mithril",
		},
		schema: [],
	},
	create: function (context) {
		return {
			ImportDeclaration: function (node) {
				if (node.source.value !== "mithril") return
				if (node.importKind === "type") return
				const defaultSpecifier = node.specifiers.find((s) => s.type === "ImportDefaultSpecifier")
				if (defaultSpecifier == null) return
				const name = defaultSpecifier.local.name
				if (name === "m") return

				if (name === "Mithril") {
					context.report({
						node,
						message: "importing mithril default export as 'Mithril': did you intend to 'import type' here?",
						data: { name },
					})
				} else {
					context.report({
						node,
						message: "importing mithril default export as {{ name }} instead of 'm'",
						data: { name },
					})
				}
			},
		}
	},
}
