// context.commands.register({
// 	id: "myPlugin.refresh",
// 	title: "Refresh",
// 	execute() {
// 		refresh()
// 	},
// })

export interface Commands {
	register(): void
	deregister(): void
}
