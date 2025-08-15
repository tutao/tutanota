function unsupported(e) {
	console.error("Failed to import the app", e)

	const img = document.createElement("img")
	img.src = "images/logo-red.svg"
	img.style.display = "block"
	img.style.margin = "0 auto"
	img.style.maxWidth = "180px"
	document.body.appendChild(img)
	document.body.style.backgroundColor = "white"
	document.body.style.color = "black"

	const h1 = document.createElement("h1")
	h1.innerText = "Tuta Mail"
	h1.style.fontFamily = "sans-serif"
	h1.style.fontSize = "40px"
	h1.style.textAlign = "center"
	document.body.appendChild(h1)

	const div = document.createElement("div")
	div.style.fontFamily = "sans-serif"
	div.style.textAlign = "center"
	div.style.fontSize = "24px"
	document.body.appendChild(div)

	const text = document.createElement("p")
	const isAndroidApp = navigator.userAgent.indexOf("Android") !== -1 && navigator.userAgent.indexOf("wv") !== -1
	if (isAndroidApp) {
		text.textContent = "Seems like your system WebView is outdated. Please see FAQ entry for more information"
	} else {
		if (e.name === "NoWASMSupport") {
			text.textContent = "Your browser doesn't support WebAssembly. Please refer to the documentation below to fix this issue: "
		} else {
			text.textContent = "Seems like your browser is not supported or outdated. Please see FAQ entry for more information"
		}
	}
	div.appendChild(text)

	const link = document.createElement("a")
	if (isAndroidApp) {
		link.href = "https://tuta.com/support/#webview"
	} else {
		if (e.name === "NoWASMSupport") {
			link.href = "https://tuta.com/support/#enable-webassembly"
		} else {
			link.href = "https://tuta.com/support/#browser-support"
		}
	}

	link.target = "_blank"
	link.textContent = link.href
	div.appendChild(link)

	const err = document.createElement("pre")
	err.textContent = navigator.userAgent + "\n" + e.toString() + "\n" + e.stack
	div.appendChild(err)
}

try {
	import("./app.js").catch(unsupported)
} catch (e) {
	unsupported(e)
}
