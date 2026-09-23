<?php

namespace OCA\TutaMail\Tests\Controller;

use OCA\TutaMail\Controller\ForbiddenOriginException;
use OCA\TutaMail\Controller\ForbiddenProxyPathException;
use OCA\TutaMail\Controller\PreflightException;
use OCA\TutaMail\Controller\ProxyController;
use OCP\AppFramework\Http;
use OCP\Http\Client\IClient;
use OCP\Http\Client\IClientService;
use OCP\Http\Client\IResponse;
use OCP\IRequest;
use OCP\IURLGenerator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ProxyControllerTest extends TestCase
{
	private IRequest $request;
	private IClientService $clientService;
	private IURLGenerator $urlGenerator;
	private ProxyController $controller;

	protected function setUp(): void
	{
		$this->request = $this->createStub(IRequest::class);
		$this->clientService = $this->createStub(IClientService::class);
		$this->urlGenerator = $this->createStub(IURLGenerator::class);
		$this->urlGenerator->method('getAbsoluteURL')->willReturn('https://cloud.example.com/');

		$this->controller = new ProxyController('tutamail', $this->request, $this->clientService, $this->urlGenerator);
	}

	private function configureRequest(string $method, string $origin, array $server = []): void
	{
		$this->request->method('getMethod')->willReturn($method);
		$this->request->method('getHeader')->willReturnCallback(
			fn(string $name) => $name === 'Origin' ? $origin : ''
		);
		// OCP\IRequest exposes $_SERVER via a magic property; PHPUnit test
		// doubles don't implement that magic, so this is a plain dynamic property.
		$this->request->server = $server;
	}

	private function stubJsonResponse(string $body, int $status = 200): IResponse
	{
		$response = $this->createStub(IResponse::class);
		$response->method('getBody')->willReturn($body);
		$response->method('getStatusCode')->willReturn($status);
		return $response;
	}

	/**
	 * Response::getHeaders() merges in framework-level headers (CSP, etc.) via
	 * the live \OC::$server container, which isn't available outside a real
	 * Nextcloud instance. Read the headers our controller explicitly set instead.
	 */
	private function getExplicitHeader(object $response, string $name): ?string
	{
		// 'headers' is private on the base Response class; PHP only exposes
		// inherited private properties via reflection on the declaring class.
		$property = (new \ReflectionClass(\OCP\AppFramework\Http\Response::class))->getProperty('headers');
		$property->setAccessible(true);
		return $property->getValue($response)[$name] ?? null;
	}

	// --- Path allowlist ---

	public function testProxyGetIsAlwaysForbidden(): void
	{
		$this->configureRequest('GET', 'https://app.tuta.com');
		$this->expectException(ForbiddenProxyPathException::class);
		$this->controller->proxyGET('index.php/login/v2');
	}

	public function testProxyPostDisallowedPathThrows(): void
	{
		$this->configureRequest('POST', 'https://app.tuta.com');
		$clientService = $this->createMock(IClientService::class);
		$clientService->expects($this->never())->method('newClient');
		$controller = new ProxyController('tutamail', $this->request, $clientService, $this->urlGenerator);

		$this->expectException(ForbiddenProxyPathException::class);
		$controller->proxyPOST('some/unlisted/path');
	}

	public function testProxyPostAllowedPathSucceeds(): void
	{
		$this->configureRequest('POST', 'https://app.tuta.com');
		$client = $this->createMock(IClient::class);
		$client->expects($this->once())
			->method('request')
			->with('POST', $this->stringContains('index.php/login/v2'), $this->anything())
			->willReturn($this->stubJsonResponse('{"ok":true}'));
		$this->clientService->method('newClient')->willReturn($client);

		$result = $this->controller->proxyPOST('index.php/login/v2');

		$this->assertSame(200, $result->getStatus());
		$this->assertSame(['ok' => true], $result->getData());
		$this->assertSame('https://app.tuta.com', $this->getExplicitHeader($result, 'Access-Control-Allow-Origin'));
	}

	public function testProxyPutAllowedPathSucceeds(): void
	{
		$this->configureRequest('PUT', 'https://app.tuta.com');
		$client = $this->createMock(IClient::class);
		$client->expects($this->once())->method('request')->willReturn($this->stubJsonResponse('{}'));
		$this->clientService->method('newClient')->willReturn($client);

		$result = $this->controller->proxyPUT('remote.php/dav/files/alice/Documents/file.txt');

		$this->assertSame(200, $result->getStatus());
	}

	// --- Origin allowlist ---

	#[DataProvider('allowedOriginProvider')]
	public function testProxyAllowsEachAllowlistedOrigin(string $origin): void
	{
		$this->configureRequest('POST', $origin);
		$client = $this->createStub(IClient::class);
		$client->method('request')->willReturn($this->stubJsonResponse('{}'));
		$this->clientService->method('newClient')->willReturn($client);

		$result = $this->controller->proxyPOST('index.php/login/v2');

		$this->assertSame($origin, $this->getExplicitHeader($result, 'Access-Control-Allow-Origin'));
	}

	public static function allowedOriginProvider(): array
	{
		return [
			'production' => ['https://app.tuta.com'],
			'test' => ['https://app.test.tuta.com'],
			'local with port' => ['https://app.local.tuta.com:9000'],
			'localhost with port' => ['http://localhost:9000'],
		];
	}

	public function testProxyRejectsDisallowedOrigin(): void
	{
		$this->configureRequest('POST', 'https://evil.example');
		$clientService = $this->createMock(IClientService::class);
		$clientService->expects($this->never())->method('newClient');
		$controller = new ProxyController('tutamail', $this->request, $clientService, $this->urlGenerator);

		$this->expectException(ForbiddenOriginException::class);
		$controller->proxyPOST('index.php/login/v2');
	}

	public function testHandleCorsMissingOriginThrowsPreflightException(): void
	{
		$this->configureRequest('OPTIONS', '');
		$this->expectException(PreflightException::class);
		$this->controller->handleCors('index.php/login/v2');
	}

	public function testHandleCorsDisallowedOriginThrowsForbiddenOriginException(): void
	{
		$this->configureRequest('OPTIONS', 'https://evil.example');
		$this->expectException(ForbiddenOriginException::class);
		$this->controller->handleCors('index.php/login/v2');
	}

	public function testHandleCorsDisallowedPathThrowsForbiddenProxyPathException(): void
	{
		$this->configureRequest('OPTIONS', 'https://app.tuta.com');
		$this->expectException(ForbiddenProxyPathException::class);
		$this->controller->handleCors('some/unlisted/path');
	}

	public function testHandleCorsAllowedOriginReturns204WithCorsHeaders(): void
	{
		$this->configureRequest('OPTIONS', 'https://app.tuta.com');

		$result = $this->controller->handleCors('index.php/login/v2');

		$this->assertSame(Http::STATUS_NO_CONTENT, $result->getStatus());
		$this->assertSame('https://app.tuta.com', $this->getExplicitHeader($result, 'Access-Control-Allow-Origin'));
		$this->assertSame('true', $this->getExplicitHeader($result, 'Access-Control-Allow-Credentials'));
		$this->assertSame('Origin', $this->getExplicitHeader($result, 'Vary'));
	}

	// --- Proxying behavior ---

	public function testProxyRedirectStripsHostAndOriginAndSetsUserAgent(): void
	{
		$this->configureRequest('POST', 'https://app.tuta.com', [
			'HTTP_HOST' => 'nextcloud.example.com',
			'HTTP_ORIGIN' => 'https://app.tuta.com',
			'HTTP_X_FORWARDED_FOR' => '203.0.113.5',
			'CONTENT_TYPE' => 'application/json',
			'CONTENT_LENGTH' => '2',
		]);

		$capturedOptions = null;
		$client = $this->createStub(IClient::class);
		$client->method('request')->willReturnCallback(
			function (string $method, string $url, array $options) use (&$capturedOptions) {
				$capturedOptions = $options;
				return $this->stubJsonResponse('{}');
			}
		);
		$this->clientService->method('newClient')->willReturn($client);

		$this->controller->proxyPOST('index.php/login/v2');

		$this->assertArrayNotHasKey('Host', $capturedOptions['headers']);
		$this->assertArrayNotHasKey('Origin', $capturedOptions['headers']);
		$this->assertSame('Tuta App', $capturedOptions['headers']['User-Agent']);
		$this->assertSame('203.0.113.5', $capturedOptions['headers']['X-Forwarded-For']);
		$this->assertSame('application/json', $capturedOptions['headers']['Content-Type']);
		$this->assertSame('2', $capturedOptions['headers']['Content-Length']);
	}

	public function testProxyRedirectForwardsQueryStringOnPost(): void
	{
		$this->configureRequest('POST', 'https://app.tuta.com', ['QUERY_STRING' => 'foo=bar']);

		$capturedUrl = null;
		$client = $this->createStub(IClient::class);
		$client->method('request')->willReturnCallback(
			function (string $method, string $url) use (&$capturedUrl) {
				$capturedUrl = $url;
				return $this->stubJsonResponse('{}');
			}
		);
		$this->clientService->method('newClient')->willReturn($client);

		$this->controller->proxyPOST('index.php/login/v2');

		$this->assertStringEndsWith('?foo=bar', $capturedUrl);
	}

	public function testProxyRedirectDecodesJsonBody(): void
	{
		$this->configureRequest('POST', 'https://app.tuta.com');
		$client = $this->createStub(IClient::class);
		$client->method('request')->willReturn($this->stubJsonResponse('{"poll":{"token":"abc"}}'));
		$this->clientService->method('newClient')->willReturn($client);

		$result = $this->controller->proxyPOST('index.php/login/v2');

		$this->assertSame(['poll' => ['token' => 'abc']], $result->getData());
	}

	public function testProxyRedirectFallsBackToRawBodyWhenNotJson(): void
	{
		$this->configureRequest('POST', 'https://app.tuta.com');
		$client = $this->createStub(IClient::class);
		$client->method('request')->willReturn($this->stubJsonResponse('not json'));
		$this->clientService->method('newClient')->willReturn($client);

		$result = $this->controller->proxyPOST('index.php/login/v2');

		$this->assertSame('not json', $result->getData());
	}

	public function testProxyRedirectReturns502OnClientException(): void
	{
		$this->configureRequest('POST', 'https://app.tuta.com');
		$client = $this->createStub(IClient::class);
		$client->method('request')->willThrowException(new \Exception('connection refused'));
		$this->clientService->method('newClient')->willReturn($client);

		$result = $this->controller->proxyPOST('index.php/login/v2');

		$this->assertSame(502, $result->getStatus());
		$this->assertSame('Proxy request failed', $result->getData()['error']);
		$this->assertSame('connection refused', $result->getData()['message']);
		$this->assertSame('https://app.tuta.com', $this->getExplicitHeader($result, 'Access-Control-Allow-Origin'));
	}
}
