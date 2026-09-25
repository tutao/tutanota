<?php

namespace OCA\TutaMail\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\CORS;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\Response;
use OCP\Http\Client\IClientService;
use OCP\IRequest;
use OCP\IURLGenerator;

class ProxyController extends Controller
{

	private IClientService $clientService;
	private IURLGenerator $urlGenerator;
	private array $ALLOWED_ORIGINS = [
			'app.tuta.com',
			'app.test.tuta.com',
			'app.local.tuta.com',
			'localhost',
	];
	private array $ALLOWED_PROXIES = [
			'GET' => [
			    "/^ocs\/v2\.php\/apps\/tutamail\/api\/v1\/version/",
			],
			'POST' => [
					'/^index\.php\/login\/v2/',
					'/^index\.php\/login\/v2\/poll/',
					'/^ocs\/v2\.php\/apps\/spreed\/api\/v4\/room/',
			],
			'PUT' => [
			        // valid characters for user names: alphabets,numerics,dot(.), hyphen(-), space( )
					'/^remote\.php\/dav\/files\/[a-z_0-9A-Z -\.]*\/.*/',
			]
	];

	public function __construct(string $AppName, IRequest $request, IClientService $clientService, IURLGenerator $urlGenerator)
	{
		parent::__construct($AppName, $request);
		$this->clientService = $clientService;
		$this->urlGenerator = $urlGenerator;

		$allPaths = array_merge(...array_values($this->ALLOWED_PROXIES));
		$this->ALLOWED_PROXIES['OPTIONS'] = $allPaths;
	}

	#[PublicPage]
	#[NoCSRFRequired]
	#[CORS]
	public function proxyPOST(string $targetUrl): Response
	{
		return $this->proxyRedirect($targetUrl);
	}

	#[PublicPage]
	#[NoCSRFRequired]
	#[CORS]
	public function proxyPUT(string $targetUrl): Response
	{
		return $this->proxyRedirect($targetUrl);
	}

	#[PublicPage]
	#[NoCSRFRequired]
	#[CORS]
	public function proxyGET(string $targetUrl): Response
	{
		return $this->proxyRedirect($targetUrl);
	}

	/**
	 * @throws ForbiddenProxyPathException
	 * @throws PreflightException
	 * @throws ForbiddenOriginException
	 */
	#[PublicPage]
	#[NoCSRFRequired]
	public function handleCors(string $path): Response
	{
		$this->ensureAllowedProxyUrl($path);
		$origin = $this->request->getHeader('Origin');
		if ($origin === '') {
			throw new PreflightException("Origin header not set");
		}
		$this->ensureAllowedOrigin($origin);
		$response = new Response();
		$response->addHeader('Access-Control-Allow-Origin', $origin);
		$response->addHeader('Access-Control-Allow-Credentials', 'true');
		$response->addHeader('Access-Control-Allow-Methods',
				'GET, POST, PUT, DELETE, OPTIONS, PROPFIND, MKCOL, MOVE, COPY');
		$response->addHeader('Access-Control-Allow-Headers',
				'Authorization, Content-Type, Depth, Destination, Overwrite, '
				. 'OCS-APIRequest, X-Requested-With, requesttoken, if-none-match, X-NC-WebDAV-Auto-Mkcol');
		$response->addHeader('Access-Control-Max-Age', '3600');
		$response->addHeader('Vary', 'Origin');
		$response->setStatus(Http::STATUS_NO_CONTENT);
		return $response;
	}

	/**
	 * @throws ForbiddenProxyPathException
	 * @throws ForbiddenOriginException
	 */
	private function proxyRedirect(string $targetUrl): DataResponse
	{

		$this->ensureAllowedProxyUrl($targetUrl);
		$origin = $this->request->getHeader('Origin');
		$this->ensureAllowedOrigin($origin);

		// 1. Change the URL to your new destination
		$baseUrl = $this->urlGenerator->getAbsoluteURL('');
		$newUrl = $baseUrl . ltrim($targetUrl, '/');


		// 2. Get the original method (GET, POST, PUT, etc.)
		$method = $this->request->getMethod();

		// 3. Extract all incoming headers
		$headers = $this->getAllRequestHeaders();

		// Remove headers that shouldn't be proxied verbatim
		unset($headers['Host'], $headers['Origin']);
		$headers['User-Agent'] = 'Tuta App';
		// Overwrite client-supplied X-Forwarded-For. getRemoteAddress() resolves through this
		// Nextcloud instance's own trusted_proxies config when present; without
		// that config it degrades to REMOTE_ADDR, which is still not
		// attacker-controlled.
		$headers['X-Forwarded-For'] = $this->request->getRemoteAddress();

		// 4. Set up the options for the new client
		$options = [
				'headers' => $headers,
				'nextcloud' => ['allow_local_address' => true]
		];

		// 5. Attach query parameters or raw body depending on the method
		if ($method === 'GET') {
			$options['query'] = $this->request->getParams();
		} else {
			$rawBody = file_get_contents('php://input');
			if ($rawBody !== '') {
				$options['body'] = $rawBody;
			}

			// If there are query parameters on a POST/PUT, you can still forward them
			$queryString = $this->request->server['QUERY_STRING'] ?? '';
			if ($queryString !== '') {
				$newUrl .= '?' . $queryString;
			}
		}

		// 6. Make the request using the new client
		$client = $this->clientService->newClient();

		try {
			// Guzzle throws exceptions on 4xx/5xx by default.
			// Setting 'http_errors' => false prevents this so we can forward the error gracefully.
			$options['http_errors'] = false;

			$response = $client->request($method, $newUrl, $options);

			// 7. Return the response back to the user
			$body = json_decode($response->getBody(), true);

			// Fallback if the response isn't JSON
			if (json_last_error() !== JSON_ERROR_NONE) {
				$body = (string)$response->getBody();
			}

			$dataResponse = new DataResponse($body, $response->getStatusCode());
			$dataResponse->addHeader('Access-Control-Allow-Origin', $origin);
			return $dataResponse;

		} catch (\Exception $e) {
			$dataResponse = new DataResponse(['error' => 'Proxy request failed', 'message' => $e->getMessage()], 502);
			$dataResponse->addHeader('Access-Control-Allow-Origin', $origin);
			return $dataResponse;
		}
	}

	/**
	 * Helper to extract headers from the Nextcloud request object
	 */
	private function getAllRequestHeaders(): array
	{
		$headers = [];
		foreach ($this->request->server as $key => $value) {
			if (str_starts_with($key, 'HTTP_')) {
				// Convert HTTP_X_FORWARDED_FOR to X-Forwarded-For
				$name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
				$headers[$name] = $value;
			}
		}

		// Content-Type and Content-Length do not get the HTTP_ prefix in PHP
		if (isset($this->request->server['CONTENT_TYPE'])) {
			$headers['Content-Type'] = $this->request->server['CONTENT_TYPE'];
		}
		if (isset($this->request->server['CONTENT_LENGTH'])) {
			$headers['Content-Length'] = $this->request->server['CONTENT_LENGTH'];
		}

		return $headers;
	}

	/**
	 * @throws ForbiddenProxyPathException
	 */
	private function ensureAllowedProxyUrl(string $targetUrl)
	{
		$method = $this->request->getMethod();
		$normalizedUrl = trim($targetUrl, '/');

		$isAllowed = false;

		// 1. Check if the HTTP method is allowed at all
		if (isset($this->ALLOWED_PROXIES[$method])) {

			// 2. Loop through the allowed regex patterns for this method
			foreach ($this->ALLOWED_PROXIES[$method] as $pattern) {
				// preg_match returns 1 if it matches, 0 if it doesn't
				if (preg_match($pattern, $normalizedUrl) === 1) {
					$isAllowed = true;
					break; // Found a match, no need to keep checking
				}
			}
		}

		// 3. Block if no match was found
		if (!$isAllowed) {
			throw new ForbiddenProxyPathException($method, $normalizedUrl);
		}

	}

	/**
	 * @throws ForbiddenOriginException
	 */
	private function ensureAllowedOrigin(string $origin): void
	{
		$host = parse_url($origin, PHP_URL_HOST);
		if (!in_array($host, $this->ALLOWED_ORIGINS, true)) {
			throw new ForbiddenOriginException($origin);
		}
	}
}

class PreflightException extends \Exception
{
	public function __construct(
			string $message,
	)
	{
		parent::__construct($message, Http::STATUS_BAD_REQUEST);
	}
}

class ForbiddenProxyPathException extends \Exception
{
	public function __construct(string $method, string $path)
	{
		parent::__construct("Forbidden Proxy Path requested: {$method}::{$path}", Http::STATUS_FORBIDDEN);
	}
}

class ForbiddenOriginException extends \Exception
{
	public function __construct(string $origin)
	{
		parent::__construct("Forbidden Origin requested: {$origin}", Http::STATUS_FORBIDDEN);
	}
}
