## Hello World Popup Plugin

```text
var uiRegistry = new UIRegistry()
var icon = File.read(./icon.svg)

uiRegistry.mail.mailView.dotMenu.add(
    icon,
    "New Button"
    () => uiRegistry.simplePopup("Hello World")
)
```

-> How do I make the api most stable and decoupled from current views (uiRegistry.mail.mailView.dotMenu)

## Translate Mail Body

```text
var uiRegistry = new UIRegistry()
var readData = ReadData()
var icon = File.read(./icon.svg)

uiRegistry.mailView.dotMenu.add(
    icon,
    "New Button"
    () => {
        var mailBody = readData.mail.body
        var requestBody = {
                text: mailBody
        }
        var req = http.request(
            "https://translate.tuta.de/dest_lang?=de",
            requestBody
        )
        
        var translatedBody = req.response.text()
        uiRegistry.mailView.body = translatedBody
    }
)
```

-> How do I carry context? How do I specify WHICH mail should be selected?

-> How do we allow http requests/ accessing external APIs (CORS)

-> How do we overwrite existing content (text) or inject?

    -> differ between modifying data and modifying rendering