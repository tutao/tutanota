System.import('systemjs-hot-reloader').then(function (connect) {
	if (location.protocol != "https:") {
		connect({host: location.protocol + '//' + location.hostname + ':9082'})
	}

	return System.import('src/app.js')
})