import m from "mithril"
import {lang} from "./misc/LanguageViewModel"
import en from "./translations/en"
import {root} from "./RootView"
import {styles} from "./gui/styles"
import "./gui/main-styles"
import {LoginView} from "./login/LoginView"


lang.init(en)


let login = new LoginView()

styles.init()

let loginViewResolver = {
	onmatch: (args, requestedPath) => {
		return login
	},
	render: (vnode) => {
		console.log("render", performance.now())
		return m(root, vnode)
	}
}


m.route(document.body, "/", {
	"/": loginViewResolver,
})
