#[macro_export]
macro_rules! __service_input_type {
	(()) => {
		$crate::services::hidden::Nothing
	};
	($i:ident) => {
		$i
	};
}

#[macro_export]
macro_rules! __service_input_value {
	($data:tt, ()) => {
		None
	};
	($data:tt, $i: tt) => {
		Some($data)
	};
}

#[macro_export]
macro_rules! __service_handle_response {
	($x:expr, $res:expr, ()) => {
		return Ok(());
	};
	($x:expr, $res:expr, $i: tt) => {
		return $x.handle_response::<Self::Output>($res).await;
	};
}

#[macro_export]
macro_rules! service_impl {
        (base, $service_name: ty, $service_path: expr, $service_version: expr) => {
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

            #[async_trait::async_trait]
            impl $service_trait for $service_name {
                type Input = $input_type;
                type Output = $output_type;

                async fn $method_name(
                    x: &impl $crate::services::Executor,
                    data: $input_type,
                    params: $crate::services::ExtraServiceParams
                ) -> ::core::result::Result<Self::Output, $crate::ApiCallError> {
                    let res = x.do_request::<Self, $crate::__service_input_type!($input_type)>(
                        $crate::__service_input_value!(data, $input_type),
                        $crate::rest_client::HttpMethod::$method_name,
                        params
                    ).await?;
                    $crate::__service_handle_response!(x, res, $output_type);
                }
            }
        };
}
