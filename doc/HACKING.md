# Hacking on the Tuta Mail client

![Overview](Overview.svg)

## Basic structure

* [`src/`](../src): Common part and the desktop client code
* [`app-android/`](../app-android): Android specific parts
* [`app-ios/`](../app-ios): iOS specific parts
* [`libs/`](../libs): "vendor" directory containing our dependencies in non-minified and minified form. May be improved.
  We take security seriously so we review diff between each version.
* [`resources/`](../resources): some resources (mostly images) which are used in the project. Most of the are embedded
  to the code.
* [`test/`](../test): test code
* [`android.js`](../android.js): script for building Android app
* [`make.js`](../make.js): script for building dev version
* [`desktop.js`](../desktop.js): script for building the release version of the desktop clients
* [`webapp.js`](../webapp.js): script for building release versions of the web application
* [`fdroid-metadata-workaround`](../fdroid-metadata-workaround): is a link inside app-android so that F-Droid can find
  our metadata because our Android project is not in the root. Can be removed once it's fixed in F-Droid.
* [`tutao-pub.pem`](../tutao-pub.pem): public key which is used to verify desktop clients

## Code structure

Web part of the app is split in three parts: client, worker and common. All code in the `src/` except for the `api/`
directory is intended for GUI and system interaction. Code in the `api`
contains most of the logic for server communication, encryption, indexing etc.

### Glossary

* `SomethingView`: Big part of the app, corresponds to the URL, e.g. `mail`, `contact`, `settings`, `search`
* `SomethingListView`: Component which displays things in the list, usually in the second column
* `SomethingViewer`: Component which usually displays one element (e.g. selected email or contact)
* `SomethingModel`: Logic for some part of the app, lives in the main part
* `SomethingController`: Something that does some bookkeeping or general action but is not tied to the specific part
* `SomethingFacade`: Logic for one domain, lives in the api part
* `SomethingApp`: Something that communicates with native part to execute tasks in certain domain
* `app`: Part of the bigger domain structure. Currently there's `system` app for accounts and such and
  `tutanota` app for mails and contacts
* `Entity`: Object corresponding to the server database entity
* `TypeModel`: Describes entity type
* `TypeRef`: Small object which lets us know which entity it is and find `TypeModel` if needed

### Communication

Worker, main thread & apps communicate through the messages. Protocol is described in the
[RemoteMessageDispatcher](../src/common/api/common/threading/MessageDispatcher.ts). See [WorkerClient](../src/common/api/main/WorkerClient.ts)
and
[WorkerImpl](../src/common/api/worker/WorkerImpl.ts) for the client and server part.

Native code communicates through the [NativeInterface](../src/common/native/common/NativeInterface.ts).

### UI code

UI code uses [Mithril](http://mithril.js.org/). It is a tiny framework which does routing & implement virtual DOM. It
uses a "hyperscript" language (`m(ComponentOrDomElement, {param: value}, [children]`). It may seem intimidating at first
but it's actually quite simple.

#### Defining a new Mithril component

Our preferred way of making Mithril components is through the ES6 classes. Before we've been creating instances of these
classes manually but that's not how Mithril should be used. Preferred way is to pass class and attributes
("props" if you come from React) to hyperscript and let it do its thing. Because of that we sometimes have two versions
of the components, newer one has "N" suffix like `ButtonN`. It is almost always preferable to use new-style components.

Current preferred way looks roughly like that:

```typescript
// Defining
import {Component} from "mithril"

type Attrs = { param1: string, paramTwo?: number }

class MyComponent implements Component<Attrs> {
	view(vnode: Vnode<Attrs>) {
		return m(".h1", "Hello " + vnode.attrs.param1)
	}
}

// Usage

// ...
m(MyComponent, {param1: "Mithril", param2: 1})
```

### Network

For working with entities it is preferable to use injected `EntityWorker` whenever possible and not using freestanding
functions. It makes easier to substitute network interfaces when needed.

One level below `EntityWorker` lays `EntityRestInterface` which is either `EntityRestClient` or `EntityRestCache`
currently. Caches saves requested entities is the memory and updates them with WebSocket events.

If you're listening for WebSocket updates in the worker part (and you should justify doing that) then you should change
[EventBus](../src/common/api/worker/EventBusClient.ts) to do that. For the main thread you can subscribe to the
[EventController](../src/common/api/main/EventController.ts).

`EventBus` and `EntityRestClient` make sure that entities are automatically encrypted/decrypted when needed. See
[decryptAndMapToInstance()](../src/common/api/worker/crypto/CryptoFacade.ts).

#### Entity updates

Most of the server database changes are reflected in the `EntityUpdate`s we receive from server. They describe operation
which happened to the entity. Updates are grouped into `EntityEventBatch`es. These batches are ordered and client tries
tp stay up-to-date with the server (for caching and indexing).

## Workflow and Testing

See [HACKING](./HACKING.md) for build pre-requisites.

Prepare the project:
1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the repository directory: `cd tutanota`
3. Initialize liboqs and argon2 submodules: `git submodule init`
4. Synchronize submodules: `git submodule sync --recursive`
5. Update submodules: `git submodule update`
6. Run `npm ci` to install dependencies.

To build the web client without specific target (will use browser URL as an API endpoint).

```bash
node make
```

You can run `node make prod` to run it against the production server.

Start any web server serving `build` directory, and you should be good to go. e.g.

```bash
npx serve build -s -p 9000` or `python -m SimpleHTTPServer 9000
```

To build desktop client against the production server:

```bash
node make -d prod
```

## Android app

Prerequisites:

You need to have Android SDK and NDK (26.1.10909125). The simplest way it to use Android studio but anything that can
run Gradle will do.

To build Android app against production server you first need to build webapp (like `node make prod`) and then build
the Android app like you would normally (e.g. import the project under `android-app` in Android Studio, run the `app`
target for the mail app).

For building calendar app run `node make prod -a calendar instead.

## iOS app

Prerequisites:

You need XCode, xcodegen.
You might need swiftlint swift-format.
You can install them through homebrew.

To build iOS app, build the web part (`node make prod`). Then generate iOS projects:

```bash
pushd tuta-sdk/ios # go into SDK directory
xcodegen # generate XCode project
popd # go back

mkdir -p build
mkdir -p build-calendar-app

cd app-ios # go into iOS app directory, generate projects for both apps
xcodegen --spec calendar-project.yml
xcodegen --spec mail-project.yml
```

After that you can open `app-ios/tuta.xcworkspace` in XCode and build the mail app.

For building calendar app run `node make prod -a calenar` instead.

### Tests

To run tests:

```bash
npm test
```

To run only the primary project tests and no tests for the modules:

```bash
npm run test:app
```

To run only specific tests:

```bash
npm run test:app -- -f 'CalendarModel'
```

To run only specific tests without npm:

```bash
node test -f CalendarModel
```

To run tests in browser:

```bash
npm run test:app -- -br
```

To run tests only in browser:

```bash
npm run test:app -- --no-run -br
```

To show all test options:

```bash
npm:run test:app -- --help
```

## Chunking rules

- Don't import things statically which you don't want to be bundled together (e.g. importing settings from login will
  load whole settings at startup)
- `common-min` is api/common which is used by main and worker threads and is needed on startup (marked by `@bundleInto`)
  . rest of api/common is just `common`.
- `main` is the rest of the main thread code that is not gui related and does not depend on sanitizer/luxon
- `date` is luxon and everything that depends on it statically
- rest is obvious: `login`, `mail-view`, `mail-editor`, `calendar-view`, `search`, `settings`, `worker`
- anything can depend on `common-min`
- anything can depend on `common` except for `common-min` and `app.js`
- anything can depend on `app.js` except worker, common-min, common
- gui-related things (like `login` or `mail-view`) can depend on `gui-base`. Currently main also depends on `gui-base`
  but it's not good
- don't depend on `settings`/`subscription`/`login`/`mail-view`/`mail-editor`/`calendar-view`/`contacts` things
  statically
- anything that depends on luxon goes into `date` and is being imported dynamically
- native code is only imported from common code dynamically. Worker is exception for technical reasons.
- `contacts` and `mail-editor` depend on sanitizer statically, rest of the app doesn't

You can check if your imports respect chunking by running `node webapp local`.