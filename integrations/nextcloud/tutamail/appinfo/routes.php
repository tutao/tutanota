<?php
return [
		'routes' => [
			// SPA entry point
				[
						'name' => 'page#index',
						'url' => '/',
						'verb' => 'GET',
				],

				// == proxy related
				[
						'name' => 'proxy#handleCors',
						'url' => '/api/v1/proxy/{path}',
						'verb' => 'OPTIONS',
						'requirements' => ['path' => '.*']
				],
				[
						'name' => 'proxy#proxyGET',
						'url' => '/api/v1/proxy/{targetUrl}',
						'verb' => 'GET',
						'requirements' => ['targetUrl' => '.+'],
				],
				[
						'name' => 'proxy#proxyPUT',
						'url' => '/api/v1/proxy/{targetUrl}',
						'verb' => 'PUT',
						'requirements' => ['targetUrl' => '.+'],
				],
				[
						'name' => 'proxy#proxyPOST',
						'url' => '/api/v1/proxy/{targetUrl}',
						'verb' => 'POST',
						'requirements' => ['targetUrl' => '.+'],
				],

				//== InAppController
				[
				    'name' => 'InApp#version',
					'url' => '/api/v1/version',
					'verb' => 'GET',
				],



				//== SPA history-mode fallback: redirects deep links back to the entry point with ?r=<path>
				// ATTENTION: put this at last as every path that does not match above will match this
				[
						'name' => 'page#spaFallback',
						'url' => '/{path}',
						'verb' => 'GET',
						'requirements' => [
								'path' => '.+',
						],
				],
		],
];
