# API

- [.init()](#pushnotificationinitoptions)
- [.hasPermission()](#pushnotificationhaspermissionsuccesshandler)
- [push.on()](#pushonevent-callback)
  - [push.on('registration')](#pushonregistration-callback)
  - [push.on('notification')](#pushonnotification-callback)
  - [push.on('error')](#pushonerror-callback)
- [push.off()](#pushoffevent-callback)
- [push.unregister()](#pushunregistersuccesshandler-errorhandler)
- [push.setApplicationIconBadgeNumber()](#pushsetapplicationiconbadgenumbersuccesshandler-errorhandler-count---ios-only)
- [push.getApplicationIconBadgeNumber()](#pushgetapplicationiconbadgenumbersuccesshandler-errorhandler---ios-only)
- [push.finish()](#pushfinishsuccesshandler-errorhandler---ios-only)

## PushNotification.init(options)

Initializes the plugin on the native side.

**Note:** like all plugins you must wait until you receive the [`deviceready`](https://cordova.apache.org/docs/en/5.4.0/cordova/events/events.deviceready.html) event before calling `PushNotification.init()`.

### Returns

- Instance of `PushNotification`.

### Parameters

Parameter | Type | Default | Description
--------- | ---- | ------- | -----------
`options` | `Object` | `{}` | An object describing relevant specific options for all target platforms.

All available option attributes are described bellow. Currently, there are no Windows specific options.

#### Android

Attribute | Type | Default | Description
--------- | ---- | ------- | -----------
`android.senderID` | `string` | | Maps to the project number in the Google Developer Console.
`android.icon` | `string` | | Optional. The name of a drawable resource to use as the small-icon. The name should not include the extension.
`android.iconColor` | `string` | | Optional. Sets the background color of the small icon on Android 5.0 and greater. [Supported Formats](http://developer.android.com/reference/android/graphics/Color.html#parseColor(java.lang.String))
`android.sound` | `boolean` | `true` | Optional. If `true` it plays the sound specified in the push data or the default system sound.
`android.vibrate` | `boolean` | `true` | Optional. If `true` the device vibrates on receipt of notification.
`android.clearNotifications` | `boolean` | `true` | Optional. If `true` the app clears all pending notifications when it is closed.
`android.forceShow` | `boolean` | `false` | Optional. If `true` will always show a notification, even when the app is on the foreground.
`android.topics` | `array` | `[]` | Optional. If the array contains one or more strings each string will be used to subscribe to a GcmPubSub topic.

#### iOS

All iOS boolean options can also be specified as `string`

Attribute | Type | Default | Description
--------- | ---- | ------- | -----------
`ios.alert` | `boolean` | `false` | Optional. If `true` the device shows an alert on receipt of notification. **Note:** the value you set this option to the first time you call the init method will be how the application always acts. Once this is set programmatically in the init method it can only be changed manually by the user in Settings>Notifications>`App Name`. This is normal iOS behaviour.
`ios.badge` | `boolean` | `false` | Optional. If `true` the device sets the badge number on receipt of notification. **Note:** the value you set this option to the first time you call the init method will be how the application always acts. Once this is set programmatically in the init method it can only be changed manually by the user in Settings>Notifications>`App Name`. This is normal iOS behaviour.
`ios.sound` | `boolean` | `false` | Optional. If `true` the device plays a sound on receipt of notification. **Note:** the value you set this option to the first time you call the init method will be how the application always acts. Once this is set programmatically in the init method it can only be changed manually by the user in Settings>Notifications>`App Name`. This is normal iOS behaviour.
`ios.clearBadge` | `boolean` | `false` | Optional. If `true` the badge will be cleared on app startup.
`ios.senderID` | `string` | `undefined` (Native) | Maps to the project number in the Google Developer Console.  Setting this uses GCM for notifications instead of native
`ios.gcmSandbox` | `boolean` | `false` | Whether to use prod or sandbox GCM setting.  Defaults to false.
`ios.topics` | `array` | `[]` | Optional. If the array contains one or more strings each string will be used to subscribe to a GcmPubSub topic. Note: only usable in conjunction with `senderID`.

### Example

```javascript
var push = PushNotification.init({
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
```

## PushNotification.hasPermission(successHandler)

Checks whether the push notification permission has been granted.

### Parameters

Parameter | Type | Default | Description
--------- | ---- | ------- | -----------
`successHandler` | `Function` | | Is called when the api successfully retrieves the details on the permission.

### Callback parameters

#### `successHandler`

Parameter | Type | Description
--------- | ---- | -----------
`data.isEnabled` | `Boolean` | Whether the permission for push notifications has been granted.

### Example

```javascript
PushNotification.hasPermission(function(data) {
    if (data.isEnabled) {
        console.log('isEnabled');
    }
});
```

## push.on(event, callback)

### Parameters

Parameter | Type | Default | Description
--------- | ---- | ------- | -----------
`event` | `string` | | Name of the event to listen to. See below for all the event names.
`callback` | `Function` | | Is called when the event is triggered.

## push.on('registration', callback)

The event `registration` will be triggered on each successful registration with the 3rd party push service.

### Callback parameters

Parameter | Type | Description
--------- | ---- | -----------
`data.registrationId` | `string` | The registration ID provided by the 3rd party remote push service.

### Example

```javascript
push.on('registration', function(data) {
	console.log(data.registrationId);
});
```

## push.on('notification', callback)

The event `notification` will be triggered each time a push notification is received by a 3rd party push service on the device.

### Callback parameters

Parameter | Type | Description
--------- | ---- | -----------
`data.message` | `string` | The text of the push message sent from the 3rd party service.
`data.title` | `string` | The optional title of the push message sent from the 3rd party service.
`data.count` | `string` | The number of messages to be displayed in the badge iOS or message count in the notification shade in Android. For windows, it represents the value in the badge notification which could be a number or a status glyph.
`data.sound` | `string` | The name of the sound file to be played upon receipt of the notification.
`data.image` | `string` | The path of the image file to be displayed in the notification.
`data.additionalData` | `Object` | An optional collection of data sent by the 3rd party push service that does not fit in the above properties.
`data.additionalData.foreground` | `boolean` | Whether the notification was received while the app was in the foreground
`data.additionalData.coldstart` | `boolean` | Will be `true` if the application is started by clicking on the push notification, `false` if the app is already started. (Android only)

### Example

```javascript
push.on('notification', function(data) {
	console.log(data.message);
	console.log(data.title);
	console.log(data.count);
	console.log(data.sound);
	console.log(data.image);
	console.log(data.additionalData);
});
```

## push.on('error', callback)

The event `error` will trigger when an internal error occurs and the cache is aborted.

### Callback parameters

Parameter | Type | Description
--------- | ---- | -----------
`e` | `Error` | Standard JavaScript error object that describes the error.

### Example

```javascript
push.on('error', function(e) {
	console.log(e.message);
});
```

## push.off(event, callback)

Removes a previously registered callback for an event.

### Parameters

Parameter | Type | Default | Description
--------- | ---- | ------- | -----------
`event` | `string` | | Name of the event type. The possible event names are the same as for the `push.on` function.
`callback` | `Function` | | The same callback used to register with `push.on`.

### Example
```javascript
var callback = function(data){ /*...*/};

//Adding handler for notification event
push.on('notification', callback);

//Removing handler for notification event
push.off('notification', callback);
```

**WARNING**: As stated in the example, you will have to store your event handler if you are planning to remove it.

## push.unregister(successHandler, errorHandler, topics)

The unregister method is used when the application no longer wants to receive push notifications. Beware that this cleans up all event handlers previously registered, so you will need to re-register them if you want them to function again without an application reload.

If you provide a list of topics as an optional parameter then the application will unsubscribe from these topics but continue to receive other push messages.

### Parameters

Parameter | Type | Default | Description
--------- | ---- | ------- | -----------
`successHandler` | `Function` | | Is called when the api successfully unregisters.
`errorHandler` | `Function` | | Is called when the api encounters an error while unregistering.
`topics` | `Array` | | A list of topics to unsubscribe from.

### Example

```javascript
push.unregister(function() {
	console.log('success');
}, function() {
	console.log('error');
});
```

## push.setApplicationIconBadgeNumber(successHandler, errorHandler, count) - iOS only

Set the badge count visible when the app is not running

### Parameters

Parameter | Type | Default | Description
--------- | ---- | ------- | -----------
`successHandler` | `Function` | | Is called when the api successfully sets the icon badge number.
`errorHandler` | `Function` | | Is called when the api encounters an error while trying to set the icon badge number.
`count` | `number` | | Indicates what number should show up in the badge. Passing 0 will clear the badge. Each `notification` event contains a `data.count` value which can be used to set the badge to correct number.

### Example

```javascript
push.setApplicationIconBadgeNumber(function() {
	console.log('success');
}, function() {
	console.log('error');
}, 2);
```

## push.getApplicationIconBadgeNumber(successHandler, errorHandler) - iOS only

Get the current badge count visible when the app is not running

### Parameters

Parameter | Type | Default | Description
--------- | ---- | ------- | -----------
`successHandler` | `Function` | | Is called when the api successfully retrieves the icon badge number.
`errorHandler` | `Function` | | Is called when the api encounters an error while trying to retrieve the icon badge number.

### Callback parameters

#### `successHandler`

Parameter | Type | Description
--------- | ---- | -----------
`n` | `number` | An integer which is the current badge count.

### Example

```javascript
push.getApplicationIconBadgeNumber(function(n) {
	console.log('success', n);
}, function() {
	console.log('error');
});
```

## push.finish(successHandler, errorHandler) - iOS only

Tells the OS that you are done processing a background push notification.

### Parameters

Parameter | Type | Default | Description
--------- | ---- | ------- | -----------
`successHandler` | `Function` | | Is called when the api successfully completes background push processing.
`errorHandler` | `Function` | | Is called when the api encounters an error while processing and completing the background push.

### Example

```javascript
push.finish(function() {
	console.log('success');
}, function() {
	console.log('error');
});
```
