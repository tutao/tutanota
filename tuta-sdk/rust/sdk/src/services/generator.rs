#[macro_export]
/// to prevent calling services that don't take input
/// with an argument or the other way around, the do_request
/// calls take `Nothing` as a standin for an entity type that isn't there
/// this way we don't have to impl Entity for ()
macro_rules! __service_input_type {
	(()) => {
		$crate::services::hidden::Nothing
	};
	($input:ident) => {
		$input
	};
}

#[macro_export]
/// if the service does not take input, we don't need to pass the
/// data (which will be () and doesn't implement Entity) to the do_request call
macro_rules! __service_input_value {
	($data:tt, ()) => {
		None
	};
	($data:tt, $input: tt) => {
		Some($data)
	};
}

#[macro_export]
/// if the service does not return anything ($output is unit)
/// we don't need to call handle_response on the executor
macro_rules! __service_handle_response {
	($x:expr, $res:expr, ()) => {
		return Ok(());
	};
	($x:expr, $res:expr, $output: tt) => {
		return $x.handle_response::<Self::Output>($res).await;
	};
}

/// helper macro to make a type "service". All services will implement `Service` trait.
/// This will be implemented by `declare` branch with *ServiceType*, *ServicePath*, and *Version*
///
/// `service_impl!(declare, ServiceType, "some-path", 10);`
///
/// To implement any http method, branch with respective token [ POST, PUT, GET, DELETE ],
/// branch with respective method can be expanded.
///
/// `service_impl!(GET, SaltService, SaltData, SaltReturn)`
///
/// If, any service does not implement either or both of input or response data type,
/// the type can be `()` and the generated http method function will take no argument while calling,
/// example:
/// `service_impl!(POST, ReportService, ReportMailPostData, ())`
///
/// # Example Usage:
/// ```ignore
/// # use tutasdk::service_impl;
/// # use tutasdk::entities::tutanota::{NewsIn, NewsOut};
///
/// pub struct NewsService;
/// // given type must be declared as Service
/// service_impl!(declare, NewsService, "tutanota/newsservice", 75);
/// // Implement a POST method on `NewsService`, which takes `NewsIn` as body
/// // and do not send any response
/// service_impl!(POST, NewsService, NewsIn, ());
/// // Implement a GET method on `NewsService`, which does not take any data as request body,
/// // but respond with `NewsOut`
/// service_impl!(GET, NewsService, (), NewsOut);
/// ```

// we don't want to generate the rust code for services from the JS directly because it's harder to maintain and
// largely unreadable.
//
// since services can either take an arg or not and return something or not, we need a trampoline implementation
// for each service that can decode and return the response or just return Ok(()) immediately after receiving a 200.
// this trampoline is implemented in the last branch below.
#[macro_export]
macro_rules! service_impl {
        (declare, $service_name: ty, $service_path: expr, $service_version: expr) => {
            // mark the type as Service
            // This implementation is required to be able to implement any HTTP method
            impl $crate::services::Service for $service_name {
                const PATH: &'static str = $service_path;
                const VERSION: u32 = $service_version;
            }
        };

        (POST, $service_name: ty,  $input_type:tt, $output_type:tt) => {
            $crate::service_impl!(@internal, $crate::services::PostService, POST, $service_name, $input_type, $output_type);
        };

        (PUT, $service_name: ty,  $input_type:tt, $output_type:tt) => {
            $crate::service_impl!(@internal, $crate::services::PutService, PUT, $service_name, $input_type, $output_type);
        };

        (GET, $service_name: ty,  $input_type:tt, $output_type:tt) => {
            $crate::service_impl!(@internal, $crate::services::GetService, GET, $service_name, $input_type, $output_type);
        };

        (DELETE, $service_name: ty,  $input_type:tt, $output_type:tt) => {
            $crate::service_impl!(@internal, $crate::services::DeleteService, DELETE, $service_name, $input_type, $output_type);
        };


        (@internal, $service_trait: path, $method_name: ident, $service_name: ty,  $input_type:tt, $output_type:tt) => {
            // This is wrapper around the type that implements [`Executor`](::crate::services::Executor) trait
            // which always takes the optional input data and respond with optional output data on success
            //
            // If this service is declared with empty `()` input type, always pass `None` to do_request
            // Once do_request is complete, and output type is defined,
            // next step is to call `handle_response` function with response bytes
            // and if output type is not defined, `handle_response` will not be called
            // *not matter* if service respond with some data or not
            // If `Input` is empty i.e `()`, this will pass `None` to actual `do_request` function
            #[async_trait::async_trait]
            impl $service_trait for $service_name {
                type Input = $input_type;
                type Output = $output_type;

                async fn $method_name(
                    x: &impl $crate::services::Executor,
                    data: $input_type,
                    params: $crate::services::ExtraServiceParams
                ) -> ::core::result::Result<Self::Output, $crate::ApiCallError> {
                    // mapping () input to `Nothing`
                    let res = x.do_request::<Self, $crate::__service_input_type!($input_type)>(
                        $crate::__service_input_value!(data, $input_type),
                        $crate::rest_client::HttpMethod::$method_name,
                        params
                    ).await?;
                    // this might call handle_response or not depending on our output type
                    $crate::__service_handle_response!(x, res, $output_type);
                }
            }
        };
}
