# Project Structure

## Overview (module groups)

```mermaid
flowchart TD
	platform_kit["platform-kit"]
	app_kit["app-kit"]
	entities["entities"]
	ui["ui"]
	usagetests["usagetests"]
	combined_apps["combined-apps"]
	plugin_kit["plugin-kit"]
	app_kit --> platform_kit
	entities --> platform_kit
	platform_kit --> entities
	ui --> entities
	plugin_kit --> app_kit
	combined_apps --> plugin_kit
	combined_apps --> ui
	combined_apps --> usagetests
```

## platform-kit

```mermaid
flowchart TD
	lang_api["lang-api"]
	app_env["app-env"]
	utils["utils"]
	http_client["http-client"]
	meta["meta"]
	rest_client["rest-client"]
	crypto["crypto"]
	instance_pipeline["instance-pipeline"]
	network["network"]
	base["base"]
	crypto_primitives_js_binding["Js Binding"]
	crypto_primitives_rust_impl["Rust impl"]
	entities_sys["entities/sys"]
	entities_base["entities/base"]
	entities_storage["entities/storage"]
	entities_monitor["entities/monitor"]
	entities_tutanota["entities/tutanota"]
	subgraph crypto_primitives["crypto-primitives"]
		direction TB
		crypto_primitives_js_binding --> crypto_primitives_rust_impl
	end

	app_env --> lang_api
	utils --> app_env
	http_client --> utils
	meta --> utils
	rest_client --> http_client
	crypto --> utils
	crypto --> crypto_primitives
	instance_pipeline --> crypto
	instance_pipeline --> rest_client
	instance_pipeline --> entities_sys
	instance_pipeline --> entities_base
	network --> instance_pipeline
	network --> entities_storage
	network --> entities_monitor
	base --> network
	base --> entities_tutanota
```

## entities (per-app API types)

```mermaid
flowchart TD
	sys["sys"]
	base["base"]
	accounting["accounting"]
	monitor["monitor"]
	usage["usage"]
	storage["storage"]
	drive["drive"]
	tutanota["tutanota (mail)"]
	meta["platform-kit/meta"]
	sys --> meta
	base --> meta
	accounting --> meta
	monitor --> meta
	usage --> meta
	storage --> sys
	drive --> sys
	tutanota --> sys
```

## app-kit, plugin-kit, ui

```mermaid
flowchart TD
	native_bridge["native-bridge"]
	local_store["local-store"]
	base["base"]
	meta["meta"]
	sdk["plugin-kit/sdk"]
	plugin_manager["plugin-manager"]
	plugins["plugin-kit/plugins"]
	mimimi_js_binding["JS Binding"]
	mimimi_rust_impl["Rust impl"]
	rust_sdk["Rust SDK"]
	subgraph mimimi["mimimi"]
		direction TB
		mimimi_js_binding --> mimimi_rust_impl
		mimimi_rust_impl --> rust_sdk
	end

	native_bridge --> base
	native_bridge --> mimimi
	native_bridge --> meta
	local_store --> native_bridge
	sdk --> native_bridge
	plugin_manager --> sdk
	plugins --> sdk
```

## ui

```mermaid
flowchart TD
	rest_client["rest-client"]
	ui["ui"]
	tutanota["entities/tutanota"]
	ui --> meta
	ui --> rest_client
	ui --> tutanota
```

## applications

```mermaid
flowchart LR
	app_calendar["calendar-app"]
	app_mail["mail-app"]
	app_drive["drive-app"]
	app_common["common"]
	app_combined["combined-apps"]
	usagetests["usagetests"]
	local_store["app-kit/local-store"]
	plugin_manager["plugin-kit/plugin-manager"]
	plugins["plugin-kit/plugins"]
	ui["ui"]
	drive["entities/drive"]
	accounting["entities/accounting"]
	storage["entities/storage"]
	usage["entities/usage"]
	app_calendar --> app_common
	app_mail --> app_common
	app_drive --> app_common
	app_combined --> app_calendar
	app_combined --> app_mail
	app_combined --> app_drive
	app_combined --> usagetests
	app_combined --> local_store
	app_combined --> plugin_manager
	app_combined --> plugins
	app_combined --> ui
	app_combined --> drive
	app_combined --> accounting
	app_combined --> storage
	app_combined --> usage
```

## PlatformKit/Lang-Api

Lang-Api is the lowest level for rest of the codebase. It encapsulates the TypeScript language construct and external
dependencies.

Extracting those into separate module helps us to extract things that needs to be manually implemented by target
language of transpiler. Given that rest of the app is build only on top of lang-api (and no other external dependencies
or typescript-specific constructs), transpiled code will look more one-to-one mapping from TypeScript to target
language.

## Code Transpilation

[Transpiler](../../tuta-transpiler) takes the [root tsconfig file](../tsconfig.json) and
generates [swift source](../transpiled/swift-sdk)
and [kotlin source](../transpiled/kotlin-sdk) equivalent in
[transpiled directory](). Lang-api on both kotlin & swift is manually maintained to satisfy the Api surface provided by
typescript's lang-api.