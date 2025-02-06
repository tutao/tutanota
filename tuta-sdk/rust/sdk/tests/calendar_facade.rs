use std::sync::Arc;
use tutasdk::date::calendar_facade::{DEFAULT_CALENDAR_COLOR, DEFAULT_CALENDAR_NAME};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::Sdk;

#[tokio::test]
async fn load_user_calendars() {
	const HOST: &str = "http://localhost:9000";

	let rest_client = NativeRestClient::try_new().unwrap();
	let sdk = Sdk::new(HOST.to_owned(), Arc::new(rest_client));
	let session = sdk
		.create_session("map-free@tutanota.de", "map")
		.await
		.unwrap();

	let calendar_facade = session.calendar_facade();

	// FIXME The user wont have a calendar before the first login on the client

	let calendars = calendar_facade.get_calendars_render_data().await;

	// assert!(calendars.is_empty());
	// After login for the first time/creating the first private calendar, fetching should return only the private calendar
	// assert!(!calendars.is_empty());
	assert_eq!(calendars.len(), 1);
	let default_private_calendar = calendars.values().next().unwrap();
	assert_eq!(default_private_calendar.name, DEFAULT_CALENDAR_NAME);
	assert_eq!(default_private_calendar.color, DEFAULT_CALENDAR_COLOR);
	println!("[Test] Calendar Facade loaded user calendars correctly!");
}

#[tokio::test]
async fn load_calendar_events() {
	const HOST: &str = "http://localhost:9000";

	let rest_client = NativeRestClient::try_new().unwrap();
	let sdk = Sdk::new(HOST.to_owned(), Arc::new(rest_client));
	let session = sdk
		.create_session("map-free@tutanota.de", "map")
		.await
		.unwrap();

	let calendar_facade = session.calendar_facade();

	let calendars = calendar_facade.get_calendars_render_data().await;
	let default_private_calendar_id = calendars.keys().next().unwrap();
	let events = calendar_facade
		.get_calendar_events(default_private_calendar_id)
		.await;

	// FIXME Default calendar doesn't have events by default
	// We have to create the events to properly test it
	assert_eq!(events.short_events.len(), 1);
	assert_eq!(events.long_events.len(), 1);

	println!("[Test] Calendar Facade loaded default calendar events correctly!");
}
