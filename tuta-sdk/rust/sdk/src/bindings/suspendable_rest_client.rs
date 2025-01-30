use crate::bindings::rest_client::{
	HttpMethod, RestClient, RestClientError, RestClientOptions, RestResponse,
};
use crate::date::{DateProvider, DateTime};
use crate::rest_error::HttpError;
use std::cmp::PartialEq;
use std::collections::HashMap;
use std::ops::Mul;
use std::sync::Arc;
use std::time::Duration;
use tokio::spawn;
use tokio::sync::RwLock;

/// something in our http client normalizes these to lowercase
const RETRY_AFTER_HEADER: &str = "retry-after";
const SUSPENSION_TIME_HEADER: &str = "suspension-time";
#[derive(uniffi::Enum, Clone, Debug, Eq, PartialEq)]
pub enum SuspensionBehavior {
	/// delay the request until the suspension is over, then return the result. this is the default.
	Suspend,
	/// return an error immediately if suspended; do not wait.
	Throw,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Suspension {
	until: DateTime,
}

/// a wrapper around the RestClient provided by the environment that respects
/// the suspension behaviour that the server enforces.
pub struct SuspendableRestClient {
	inner: Arc<dyn RestClient>,
	date_provider: Arc<dyn DateProvider>,
	// we use a RwLock so we can have a dedicated writer task that lifts the suspension when it's over but an arbitrary
	// amount of waiting requests.
	suspension: Arc<RwLock<Option<Suspension>>>,
}

impl SuspendableRestClient {
	pub fn new(inner: Arc<dyn RestClient>, date_provider: Arc<dyn DateProvider>) -> Self {
		Self {
			inner,
			date_provider,
			suspension: Arc::new(RwLock::new(None)),
		}
	}

	/// set a new suspension value in the RwLock.
	/// might overwrite an existing value and will even delete the current suspension if the new
	/// suspension is elapsed already.
	///
	/// the implicit assumption is that the last suspension we see always wins, no matter if it
	/// expires before the one we already have.
	async fn update_suspension(&self, suspension: Suspension) {
		let maybe_sleep_duration = get_sleep_time(self.date_provider.now(), suspension.until);
		{
			let mut write_lock_guard = self.suspension.write().await;
			if maybe_sleep_duration.is_none() {
				// the new suspension is actually already elapsed
				*write_lock_guard = None;
				return;
			}

			log::info!("setting suspension {:?}", suspension.until);
			*write_lock_guard = Some(suspension.clone());
		}
		let rw_lock = Arc::clone(&self.suspension);
		let date_provider = Arc::clone(&self.date_provider);
		// asynchronously schedule the suspension to be lifted
		spawn(async move {
			let our_suspension = suspension;
			// unwrap - we checked above that there is something in there
			tokio::time::sleep(maybe_sleep_duration.unwrap_or_default()).await;
			let mut write_lock_guard = rw_lock.write().await;
			if let Some(new_suspension) = write_lock_guard.as_ref() {
				if *new_suspension == our_suspension {
					log::info!(
						"removing suspension, it's {}",
						date_provider.now().as_millis()
					);
					*write_lock_guard = None;
				}
			}
		});
	}

	/// wait for the current suspension to elapse before actually doing the request.
	/// if there is no suspension or the suspension elapsed, no waiting is  done.
	///
	/// should the caller specify the throw behavior, we return immediately with a suspension error
	async fn wait_for_suspension(
		&self,
		behavior: &Option<SuspensionBehavior>,
	) -> Result<(), RestClientError> {
		let maybe_sleep_duration: Option<Duration> = {
			let read_lock_guard = self.suspension.read().await;
			let Some(suspension) = read_lock_guard.as_ref() else {
				// no suspension, we're good to go
				return Ok(());
			};
			get_sleep_time(self.date_provider.now(), suspension.until)
		};
		if let Some(duration) = maybe_sleep_duration {
			match behavior {
				None | Some(SuspensionBehavior::Suspend) => {
					tokio::time::sleep(duration).await;
					Ok(())
				},
				Some(SuspensionBehavior::Throw) => Err(RestClientError::Suspended),
			}
		} else {
			// the sleep duration would have been negative, good to go.
			Ok(())
		}
	}
}

#[async_trait::async_trait]
impl RestClient for SuspendableRestClient {
	async fn request_binary(
		&self,
		url: String,
		method: HttpMethod,
		options: RestClientOptions,
	) -> Result<RestResponse, RestClientError> {
		self.wait_for_suspension(&options.suspension_behavior)
			.await?;
		let response = self.inner.request_binary(url, method, options).await?;
		if let Some(suspension) = get_suspension(self.date_provider.now(), &response) {
			self.update_suspension(suspension).await;
		}
		Ok(response)
	}
}

/// extract a suspension from a rest response.
#[must_use]
pub fn get_suspension(now: DateTime, response: &RestResponse) -> Option<Suspension> {
	let precondition = response.headers.get("Precondition");
	if matches!(response.status, 200..=299) {
		return None;
	}
	let error = HttpError::from_http_response(response.status, precondition).ok()?;
	match error {
		HttpError::TooManyRequestsError | HttpError::ServiceUnavailableError => {
			let retry_after_ms = get_suspension_time(&response.headers)?;
			Some(Suspension {
				until: DateTime::from_millis(now.as_millis() + retry_after_ms),
			})
		},
		_ => None,
	}
}

fn get_suspension_time(headers: &HashMap<String, String>) -> Option<u64> {
	let time = match headers.get(RETRY_AFTER_HEADER) {
		None => headers.get(SUSPENSION_TIME_HEADER)?,
		Some(time) => time,
	};

	time.parse::<u64>().ok().map(|t| t.mul(1000))
}

/// tests sleep_until SystemTime against SystemTime::now to figure out how long
/// to wait until we reach sleep_until. returns None if sleep_until is in the past.
fn get_sleep_time(now: DateTime, sleep_until: DateTime) -> Option<Duration> {
	if sleep_until > now {
		Some(Duration::from_millis(
			sleep_until.as_millis() - now.as_millis(),
		))
	} else {
		None
	}
}

#[cfg(test)]
mod tests {
	use crate::bindings::rest_client::{
		HttpMethod, RestClient, RestClientError, RestClientOptions, RestResponse,
	};
	use crate::bindings::suspendable_rest_client::SuspensionBehavior::Suspend;
	use crate::bindings::suspendable_rest_client::{
		get_sleep_time, get_suspension, SuspendableRestClient, Suspension, SuspensionBehavior,
		RETRY_AFTER_HEADER,
	};
	use crate::bindings::test_rest_client::TestRestClient;
	use crate::date::date_provider::stub::DateProviderStub;
	use crate::date::DateTime;
	use std::collections::HashMap;
	use std::sync::Arc;
	use std::time::Duration;
	use std::time::{SystemTime, UNIX_EPOCH};

	fn timestamp() -> u64 {
		SystemTime::now()
			.duration_since(UNIX_EPOCH)
			.unwrap()
			.as_millis()
			.try_into()
			.unwrap()
	}

	#[test]
	fn get_suspension_returns_suspension_on_too_many_requests_error() {
		let now = DateTime::from_millis(0);
		let response = RestResponse {
			status: 429,
			headers: HashMap::from([(String::from(RETRY_AFTER_HEADER), String::from("60"))]),
			body: None,
		};
		let actual_suspension = get_suspension(now, &response).unwrap();
		let expected_suspension = Suspension {
			until: DateTime::from_millis(now.as_millis() + 60_000),
		};
		assert_eq!(actual_suspension, expected_suspension);
	}

	#[test]
	fn get_suspension_returns_suspension_on_service_unavailable_error() {
		let now = DateTime::from_millis(0);
		let response = RestResponse {
			status: 503,
			headers: HashMap::from([(String::from(RETRY_AFTER_HEADER), String::from("20"))]),
			body: None,
		};
		let actual_suspension = get_suspension(now, &response).unwrap();
		let expected_suspension = Suspension {
			until: DateTime::from_millis(now.as_millis() + 20_000),
		};
		assert_eq!(actual_suspension, expected_suspension);
	}

	#[test]
	fn get_sleep_time_returns_correct_duration_if_sleep_until_in_future() {
		let now = DateTime::from_millis(0);
		let sleep_until = DateTime::from_millis(1000);
		let maybe_duration = get_sleep_time(now, sleep_until);
		assert_eq!(maybe_duration, Some(Duration::from_millis(1000)));
	}
	#[test]
	fn get_sleep_time_returns_none_if_sleep_until_equals_now() {
		let now = DateTime::from_millis(0);
		let sleep_until = DateTime::from_millis(0);
		let maybe_duration = get_sleep_time(now, sleep_until);
		assert_eq!(maybe_duration, None);
	}

	#[test]
	fn get_sleep_time_returns_none_if_sleep_until_in_past() {
		let now = DateTime::from_millis(1000);
		let sleep_until = DateTime::from_millis(0);
		let maybe_duration = get_sleep_time(now, sleep_until);
		assert_eq!(maybe_duration, None);
	}

	#[tokio::test]
	async fn respects_too_many_requests_with_retry_after() {
		let now = DateTime::from_millis(0);
		let mut test_rest_client = TestRestClient::default();
		let suspend_url = "/suspend";
		let test_url = "/test";
		test_rest_client.insert_response(
			suspend_url,
			HttpMethod::POST,
			429,
			Some(HashMap::from([(
				String::from(RETRY_AFTER_HEADER),
				String::from("1"),
			)])),
			None,
		);
		test_rest_client.insert_response(test_url, HttpMethod::POST, 200, None, None);
		let date_provider = DateProviderStub::new(0);
		let suspendable_client =
			SuspendableRestClient::new(Arc::new(test_rest_client), Arc::new(date_provider));
		let suspension_rest_response = suspendable_client
			.request_binary(
				String::from(suspend_url),
				HttpMethod::POST,
				RestClientOptions {
					headers: Default::default(),
					body: None,
					suspension_behavior: Some(Suspend),
				},
			)
			.await
			.unwrap();
		let maybe_suspension = get_suspension(now, &suspension_rest_response);
		assert_eq!(
			Some(Suspension {
				until: DateTime::from_millis(1_000),
			}),
			maybe_suspension
		);

		// we should now be suspended
		let before_request_ms = timestamp();
		let _ = suspendable_client
			.request_binary(
				String::from(test_url),
				HttpMethod::POST,
				RestClientOptions {
					headers: Default::default(),
					body: None,
					suspension_behavior: Some(Suspend),
				},
			)
			.await
			.unwrap();
		let after_request_ms = timestamp();
		assert!(before_request_ms + 1_000 <= after_request_ms);
	}

	#[tokio::test]
	async fn respects_service_unavailable_error_with_retry_after() {
		let now = DateTime::from_millis(0);
		let mut test_rest_client = TestRestClient::default();
		let suspend_url = "/suspend";
		let test_url = "/test";
		test_rest_client.insert_response(
			suspend_url,
			HttpMethod::POST,
			503,
			Some(HashMap::from([(
				String::from(RETRY_AFTER_HEADER),
				String::from("1"),
			)])),
			None,
		);
		test_rest_client.insert_response(test_url, HttpMethod::POST, 200, None, None);
		let date_provider = DateProviderStub::new(0);
		let suspendable_client =
			SuspendableRestClient::new(Arc::new(test_rest_client), Arc::new(date_provider));
		let suspension_rest_response = suspendable_client
			.request_binary(
				String::from(suspend_url),
				HttpMethod::POST,
				RestClientOptions {
					headers: Default::default(),
					body: None,
					suspension_behavior: Some(Suspend),
				},
			)
			.await
			.unwrap();

		let maybe_suspension = get_suspension(now, &suspension_rest_response);
		assert_eq!(
			Some(Suspension {
				until: DateTime::from_millis(1_000),
			}),
			maybe_suspension
		);

		// we should now be suspended
		let before_request_ms = timestamp();
		let _ = suspendable_client
			.request_binary(
				String::from(test_url),
				HttpMethod::POST,
				RestClientOptions {
					headers: Default::default(),
					body: None,
					suspension_behavior: Some(Suspend),
				},
			)
			.await
			.unwrap();
		let after_request_ms = timestamp();
		assert!(before_request_ms + 1_000 <= after_request_ms);
	}

	#[tokio::test]
	async fn respects_service_unavailable_error_with_retry_after_throws() {
		let mut test_rest_client = TestRestClient::default();
		let suspend_url = "/suspend";
		let test_url = "/test";
		test_rest_client.insert_response(
			suspend_url,
			HttpMethod::POST,
			503,
			Some(HashMap::from([(
				String::from(RETRY_AFTER_HEADER),
				String::from("1"),
			)])),
			None,
		);
		test_rest_client.insert_response(test_url, HttpMethod::POST, 200, None, None);
		let date_provider = DateProviderStub::new(0);
		let suspendable_client =
			SuspendableRestClient::new(Arc::new(test_rest_client), Arc::new(date_provider));
		let _ = suspendable_client
			.request_binary(
				String::from(suspend_url),
				HttpMethod::POST,
				RestClientOptions {
					headers: Default::default(),
					body: None,
					suspension_behavior: Some(SuspensionBehavior::Throw),
				},
			)
			.await
			.unwrap();

		// we should now be suspended
		let suspended_result = suspendable_client
			.request_binary(
				String::from(test_url),
				HttpMethod::POST,
				RestClientOptions {
					headers: Default::default(),
					body: None,
					suspension_behavior: Some(SuspensionBehavior::Throw),
				},
			)
			.await;
		match suspended_result {
			Err(RestClientError::Suspended) => {},
			_ => panic!("expected suspended error"),
		}
	}
}
