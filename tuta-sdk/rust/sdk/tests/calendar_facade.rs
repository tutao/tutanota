use std::sync::Arc;
use tutasdk::date::calendar_facade::{
	CalendarFacade, DEFAULT_CALENDAR_COLOR, DEFAULT_CALENDAR_NAME, DEFAULT_LONG_EVENT_NAME,
	DEFAULT_SORT_EVENT_NAME,
};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::Sdk;

async fn create_calendar_facade() -> CalendarFacade {
	const HOST: &str = "http://localhost:9000";

	let rest_client = NativeRestClient::try_new().unwrap();
	let sdk = Sdk::new(HOST.to_owned(), Arc::new(rest_client));
	let session = sdk
		.create_session("arm-free@tutanota.de", "arm")
		.await
		.unwrap();

	let calendar_facade = session.calendar_facade();
	calendar_facade
}

#[tokio::test]
async fn load_user_calendars() {
	let calendar_facade = create_calendar_facade().await;
	// Should return only the default private calendar created on login (or, for tests, on the TestTool)
	let calendars = calendar_facade.get_calendars_render_data().await;
	assert_eq!(calendars.len(), 1);
	let default_private_calendar = calendars.values().next().unwrap();
	assert_eq!(default_private_calendar.name, DEFAULT_CALENDAR_NAME);
	assert_eq!(default_private_calendar.color, DEFAULT_CALENDAR_COLOR);
	log::info!("Test::Loaded user calendars correctly!");
}

#[tokio::test]
async fn load_calendar_events() {
	let calendar_facade = create_calendar_facade().await;
	let calendars = calendar_facade.get_calendars_render_data().await;
	let default_private_calendar_id = calendars.keys().next().unwrap();
	let events = calendar_facade
		.get_calendar_events(default_private_calendar_id)
		.await;

	assert_eq!(events.short_events.len(), 1);
	assert_eq!(
		events.short_events.iter().next().unwrap().summary,
		DEFAULT_SORT_EVENT_NAME
	);
	assert_eq!(events.long_events.len(), 1);
	assert_eq!(
		events.long_events.iter().next().unwrap().summary,
		DEFAULT_LONG_EVENT_NAME
	);
	log::info!("Test::Loaded default calendar events correctly!");
}
