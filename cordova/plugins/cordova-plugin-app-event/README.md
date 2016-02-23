[![npm version](https://badge.fury.io/js/cordova-plugin-app-event.svg)](http://badge.fury.io/js/cordova-plugin-app-event)

Cordova App-Event Plugin
========================

The essential purpose of that plugin is to broadcast iOS-specific application events, so that 3rd party plugins can listen to them.

Its mainly used as an internal dependency for the [LocalNotification][local_notification_plugin] and [Badge][badge_plugin] plugin. But can be used by any other plugin also. Feel free to submit an PR to broadcast additional events.

As of right now its possible to add observers for these events:
- [didFinishLaunchingWithOptions][didFinishLaunchingWithOptions]
- [didRegisterUserNotificationSettings][didRegisterUserNotificationSettings]
- [didReceiveLocalNotification][didReceiveLocalNotification]


## Usage

#### 1. Add and install the plugin as an dependency
Once you have added the plugin as an dependency you can add observers for them.

```xml
<!-- plugin.xml -->

<dependency id="cordova-plugin-app-event" />
```

#### 2. Add the protocol to the plugin's interface
As first the plugin needs to indicate interest to receivce app events by adding the `APPAppEventDelegate` protocol.

__Note:__ Required for version 1.2.0 or newer!

```obj-c
// MyCordovaPlugin.h

#import "APPAppEventDelegate.h"
#import <Cordova/CDVPlugin.h>

@interface APPLocalNotification : CDVPlugin <APPAppEventDelegate>

@implementation MyCordovaPlugin

...

@end
```

#### 3. Add implementations for the delegated events
To add an observer you need to implement the [UIApplicationDelegate Protocol][app_delegate_protocol]. Implementations from your _AppDelegate_ class don't get overwritten!

For the `didReceiveLocalNotification` event you would need to add that method.

```obj-c
// MyCordovaPlugin.m

@implementation MyCordovaPlugin

- (void) didReceiveLocalNotification:(NSNotification*)localNotification
{
    ...
}

@end
```


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

This software is released under the [Apache 2.0 License][apache2_license].

© 2013-2016 appPlant UG, Inc. All rights reserved


[local_notification_plugin]: https://github.com/katzer/cordova-plugin-local-notifications
[badge_plugin]: https://github.com/katzer/cordova-plugin-badge
[didFinishLaunchingWithOptions]: https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/index.html?hl=ar#//apple_ref/occ/intfm/UIApplicationDelegate/application:didFinishLaunchingWithOptions:
[didRegisterUserNotificationSettings]: https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/index.html?hl=ar#//apple_ref/occ/intfm/UIApplicationDelegate/application:didRegisterUserNotificationSettings:
[didReceiveLocalNotification]: https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/index.html?hl=ar#//apple_ref/occ/intfm/UIApplicationDelegate/application:didReceiveLocalNotification:
[app_delegate_protocol]: https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/
[apache2_license]: http://opensource.org/licenses/Apache-2.0
