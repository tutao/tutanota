
[![npm version](https://badge.fury.io/js/de.appplant.cordova.plugin.local-notification.svg)](http://badge.fury.io/js/de.appplant.cordova.plugin.local-notification)
[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=L3HKQCD9UA35A "Donate once-off to this project using Paypal")

Cordova Local-Notification Plugin
=================================

The essential purpose of local notifications is to enable an application to inform its users that it has something for them — for example, a message or an upcoming appointment — when the application isn’t running in the foreground.<br>
They are scheduled by an application and delivered on the same device.

<img width="35%" align="right" hspace="19" vspace="12" src="https://raw.githubusercontent.com/katzer/cordova-plugin-local-notifications/example/images/android.png"></img>

### How they appear to the user
Users see notifications in the following ways:
- Displaying an alert or banner
- Badging the app’s icon
- Playing a sound


### Examples of Notification Usage
Local notifications are ideally suited for applications with time-based behaviors, such as calendar and to-do list applications. Applications that run in the background for the limited period allowed by iOS might also find local notifications useful.<br>
For example, applications that depend on servers for messages or data can poll their servers for incoming items while running in the background; if a message is ready to view or an update is ready to download, they can then present a local notification immediately to inform their users.


## Supported Platforms
The current 0.8 branch supports the following platforms:
- __iOS__ _(>= 8)_<br>
- __Android__ _(SDK >=7)_
- __Windows 8.1__ _(added with v0.8.2)_
- __Windows Phone 8.1__ _(added with v0.8.2)_
- __Windows 10__ _(added with v0.8.3)_

Find out more informations [here][wiki_platforms] in our wiki.


## Installation
The plugin is installable from source and available on Cordova Plugin Registry and PhoneGap Build.

Find out more informations [here][wiki_installation] in our wiki.


## I want to get a quick overview
All wiki pages contain samples, but for a quick overview the sample section may be the fastest way.

Find out more informations [here][wiki_samples] in our wiki.


## I want to get a deep overview
The plugin supports scheduling local notifications in various ways with a single interface. It also allows you to update, clear or cancel them. There are different interfaces to query for local notifications and a complete set of events to hook into the life cycle of local notifications.

Find out more about how to schedule single, multiple, delayed or repeating local notifications [here][wiki_schedule].<br>
Informations about events like _click_ or _trigger_ can be found [here][wiki_events].

To get a deep overview we recommend to read about all the topics in our [wiki][wiki] and try out the [Kitchen Sink App][wiki_kitchensink]


## I want to see the plugin in action
The plugin offers a kitchen sink sample app. Check out the cordova project and run the app directly from your command line or preferred IDE.

Find out more informations [here][wiki_kitchensink] in our wiki.


## What's new
We are proud to announce our newest release version 0.8.x. Beside the hard work at the office and at the weekends it contains a lot of goodies, new features and easy to use APIs.

Find out more informations [here][wiki_changelog] in our wiki.


## Sample
The sample demonstrates how to schedule a local notification which repeats every week. The listener will be called when the user has clicked on the local notification.

```javascript
cordova.plugins.notification.local.schedule({
    id: 1,
    title: "Production Jour fixe",
    text: "Duration 1h",
    firstAt: monday_9_am,
    every: "week",
    sound: "file://sounds/reminder.mp3",
    icon: "http://icons.com/?cal_id=1",
    data: { meetingId:"123#fg8" }
});

cordova.plugins.notification.local.on("click", function (notification) {
    joinMeeting(notification.data.meetingId);
});
```

Find out more informations [here][wiki_samples] in our wiki.


## I would like to propose new features
We appricate any feature proposal and support for their development. Please describe them [here][feature_proposal_issue].

Find out more informations [here][wiki_next] in our wiki.

## Supporting
Your support is needed. If you use the plugin please send us a drop through the donation button.

Thank you!

[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=L3HKQCD9UA35A "Donate once-off to this project using Paypal")


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

This software is released under the [Apache 2.0 License][apache2_license].

© 2013-2016 appPlant UG, Inc. All rights reserved


[cordova]: https://cordova.apache.org
[wiki]: https://github.com/katzer/cordova-plugin-local-notifications/wiki
[wiki_platforms]: https://github.com/katzer/cordova-plugin-local-notifications/wiki/02.-Platforms
[wiki_installation]: https://github.com/katzer/cordova-plugin-local-notifications/wiki/03.-Installation
[wiki_kitchensink]: https://github.com/katzer/cordova-plugin-local-notifications/tree/example
[wiki_schedule]: https://github.com/katzer/cordova-plugin-local-notifications/wiki/04.-Scheduling
[wiki_events]: https://github.com/katzer/cordova-plugin-local-notifications/wiki/09.-Events
[wiki_samples]: https://github.com/katzer/cordova-plugin-local-notifications/wiki/11.-Samples
[wiki_changelog]: https://github.com/katzer/cordova-plugin-local-notifications/wiki/Upgrade-Guide
[wiki_next]: https://github.com/katzer/cordova-plugin-local-notifications/wiki/Feature-Requests
[feature_proposal_issue]: https://github.com/katzer/cordova-plugin-local-notifications/issues/451
[apache2_license]: http://opensource.org/licenses/Apache-2.0
