# Typescript definition file

For those of you who use typescript, we're glad to say that we have the complete definition file available at [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped).
Search for `phonegap-plugin-push` there, or simply grab it directly [here](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/phonegap-plugin-push/phonegap-plugin-push.d.ts).

## Example usage

All objects will be understood as having a defined type, including init options and eventHandler parameters.
All available attributes and properties will have autocomplete support and type checkings.

```typescript
let push = PushNotification.init({
	android: {
		senderID: "12345679"
	},
	ios: {
		alert: "true",
		badge: true,
		sound: 'false'
	},
	windows: {}
});

push.on('registration', (data) => {
	console.log(data.registrationId);
});

push.on('notification', (data) => {
	console.log(data.message);
	console.log(data.title);
	console.log(data.count);
	console.log(data.sound);
	console.log(data.image);
	console.log(data.additionalData);
});

push.on('error', (e) => {
	console.log(e.message);
});
```

If you have custom attributes being sent from the server on the payload, you can define them on a custom interface extending the standard one:

```typescript
module my.custom {
	export interface NotificationEventResponse extends PhonegapPluginPush.NotificationEventResponse {
		additionalData: NotificationEventAdditionalData;
	}

	export interface NotificationEventAdditionalData extends PhonegapPluginPush.NotificationEventAdditionalData {
		bacon?: boolean;
	}
}

push.on('notification', (data: my.custom.NotificationEventResponse) => {
	//standard attributes
	console.log(data.message);
	console.log(data.title);
	console.log(data.count);
	console.log(data.sound);
	console.log(data.image);
	console.log(data.additionalData);

	//custom attributes
	console.log(data.additionalData.bacon);
});
```

## Outdated definitions

Is our definition file at DefinitelyTyped outdated? Is there any improvements that could be done?
We welcome any contribution, and they should be done through issues created [there](https://github.com/DefinitelyTyped/DefinitelyTyped/issues/new). 