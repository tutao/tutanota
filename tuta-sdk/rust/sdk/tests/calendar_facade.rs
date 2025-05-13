use std::sync::Arc;
use time::macros::datetime;
use tutasdk::bindings::test_file_client::TestFileClient;
use tutasdk::date::calendar_facade::{
	CalendarFacade, DEFAULT_CALENDAR_COLOR, DEFAULT_CALENDAR_NAME, DEFAULT_LONG_EVENT_NAME,
	DEFAULT_SHORT_EVENT_NAME,
};
use tutasdk::date::DateTime;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{GeneratedId, Sdk};

struct UserLoginData {
	email: String,
	password: String,
}

async fn create_calendar_facade(user_data: UserLoginData) -> CalendarFacade {
	const HOST: &str = "http://localhost:9000";

	let rest_client = NativeRestClient::try_new().unwrap();
	let file_client = TestFileClient::default();

	let sdk = Sdk::new(
		HOST.to_owned(),
		Arc::new(rest_client),
		Arc::new(file_client),
	);
	let session = sdk
		.create_session(&user_data.email, &user_data.password)
		.await
		.unwrap();

	let calendar_facade = session.calendar_facade();
	calendar_facade
}

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn load_free_user_calendars() {
	let calendar_facade = create_calendar_facade(UserLoginData {
		email: "arm-free@tutanota.de".to_string(),
		password: "arm".to_string(),
	})
	.await;
	// Should return only the default private calendar created on login (or, for tests, on the TestTool)
	let calendars = calendar_facade.get_calendars_render_data().await;
	assert_eq!(calendars.len(), 1);
	let default_private_calendar = calendars.values().next().unwrap();
	assert_eq!(default_private_calendar.name, DEFAULT_CALENDAR_NAME);
	assert_eq!(default_private_calendar.color, DEFAULT_CALENDAR_COLOR);
	log::info!("Test::Loaded user calendars correctly!");
}

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn load_premium_user_calendars() {
	let calendar_facade = create_calendar_facade(UserLoginData {
		email: "bed-premium@tutanota.de".to_string(),
		password: "bed".to_string(),
	})
	.await;
	let calendars = calendar_facade.get_calendars_render_data().await;
	assert_eq!(calendars.len(), 2); // Default private + brithdays
	log::info!("Test::Loaded user calendars correctly!");
}

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn load_calendar_events() {
	let calendar_facade = create_calendar_facade(UserLoginData {
		email: "arm-free@tutanota.de".to_string(),
		password: "arm".to_string(),
	})
	.await;
	let calendars = calendar_facade.get_calendars_render_data().await;
	assert_eq!(calendars.len(), 1);
	let default_private_calendar_id = calendars.keys().next().unwrap();

	let date_time = datetime!(2025-01-31 07:00:00).assume_utc().unix_timestamp() as u64;

	let events = calendar_facade
		.get_calendar_events(
			default_private_calendar_id,
			DateTime::from_millis(date_time * 1000),
		)
		.await;

	assert_eq!(events.short_events.len(), 1);
	assert_eq!(
		events.short_events.first().unwrap().summary,
		DEFAULT_SHORT_EVENT_NAME
	);
	assert_eq!(events.long_events.len(), 1);
	assert_eq!(
		events.long_events.first().unwrap().summary,
		DEFAULT_LONG_EVENT_NAME
	);
	log::info!("Test::Loaded default calendar events correctly!");
}

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn load_birthday_events() {
	let calendar_facade = create_calendar_facade(UserLoginData {
		email: "arm-free@tutanota.de".to_string(),
		password: "arm".to_string(),
	})
	.await;
	let date_time = datetime!(2025-12-31 07:00:00).assume_utc().unix_timestamp() as u64;

	let events = calendar_facade
		.get_calendar_events(
			&GeneratedId("clientOnly_birthdays".to_string()),
			DateTime::from_millis(date_time * 1000),
		)
		.await;

	assert_eq!(events.short_events.len(), 0);
	assert_eq!(events.long_events.len(), 0);
	assert_eq!(events.birthday_events.len(), 1);

	log::info!("Test::Loaded birthday calendar events correctly!");
}
