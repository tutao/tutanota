## Websocket PhoneGap plugin for Android

Phonegap plugin which adds support for websockets under Android.
The websocket client is based on [Java-WebSocket](https://github.com/TooTallNate/Java-WebSocket).

## Features

* supports multiple [protocols / drafts](https://github.com/TooTallNate/Java-WebSocket/wiki/Drafts)
* compatible with Phonegap 3.x and installable via PhoneGap (or Cordova) CLI.
* works well with  [socket.io](http://socket.io/) and other WebSocket libraries.
* supports WSS
* supports binary data 
* falls back to native WebSocket in KitKat

The older version of the plugin (PhoneGap 2.x.x) can be found here: https://github.com/mkuklis/phonegap-websocket/tree/phonegap-2.x.x

## Installation

Inside your phonegap project:

```bash
cordova plugin add https://github.com/mkuklis/phonegap-websocket
```

Or using the phonegap CLI:

```bash
phonegap local plugin add https://github.com/mkuklis/phonegap-websocket
```

## Demo

You can find demo based on this plugin and socket.io here:

[https://bitbucket.org/mkuklis/phonegap-websocket-demo](https://bitbucket.org/mkuklis/phonegap-websocket-demo)

## Note

If you plan to test it locally from your emulator please make sure to use `10.0.2.2` ip address when connecting to your local server.

If you plan to run it from your phone please make sure to update your `config.xml` file and add your server's IP address to the `access` tag (e.g. `<access origin="YOUR_IP_ADDRESS:YOUR_PORT" />` ) More information can be found [here](http://docs.phonegap.com/en/3.0.0/guide_appdev_whitelist_index.md.html#Domain%20Whitelist%20Guide).

## Contributors

* [@remy](http://github.com/remy)
* [@fancycode](http://github.com/fancycode)
* [@dhuyvett](http://github.com/dhuyvett)
* [@eliseumds](http://github.com/eliseumds)
* [@MayurChandra](http://github.com/MayurChandra)
* [@rgillan](http://github.com/rgillan)

##License:

<pre>
The MIT License
</pre>