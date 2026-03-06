<?php

declare(strict_types=1);

namespace OCA\TutaMail\Controller;

use OCP\AppFramework\Http\Attribute\ApiRoute;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\DataDisplayResponse;
use OCP\AppFramework\OCSController;
use OCP\Http\Client\IClientService;
use OCP\Http\Client\IResponse;
use OCP\IRequest;
use RuntimeException;
use function OCP\Log\logger;

/**
 * @psalm-suppress UnusedClass
 */
class ApiController extends OCSController
{
	private IClientService $clientService;
	private string $TUTA_SERVER_URL = 'http://frm:9000';

	public function __construct(
			string         $appName,
			IRequest       $request,
			IClientService $clientService,
	)
	{
		parent::__construct($appName, $request);
		$this->clientService = $clientService;
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'GET',
			url: '/rest/{tutaAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaGETServiceResourceRedirect(): DataDisplayResponse
	{
		return $this->redirectToTutaServer();
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'POST',
			url: '/rest/{tutaAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaPOSTServiceRedirect(): DataDisplayResponse
	{
		return $this->redirectToTutaServer();
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'DELETE',
			url: '/rest/{tutaAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaDELETERedirect(): DataDisplayResponse
	{
		return $this->redirectToTutaServer();
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'PATCH',
			url: '/rest/{tutaAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaPATCHRedirect(): DataDisplayResponse
	{
		return $this->redirectToTutaServer();
	}

	/**
	 * @throws \Exception
	 */
	#[NoAdminRequired]
	#[ApiRoute(
			verb: 'PUT',
			url: '/rest/{tutaAppName}/{component}',
			requirements: ['component' => '.+'],
	)]
	public function tutaPUTRedirect(): DataDisplayResponse
	{
		return $this->redirectToTutaServer();
	}

	/**
	 * @throws \Exception
	 */
	private function redirectToTutaServer(): DataDisplayResponse
	{
		$request = $this->request;
		// FIXME: should probably use one request client.
		$client = $this->clientService->newClient();

		$tuta_path = $this->getRedirectedTutaPath($request);
		$options = $this->makeTutaRequstOptions($request);
		$tutaResponse = $client->request($request->getMethod(), $tuta_path, $options);
		return $this->wrapResponseFromTuta($tutaResponse);

	}

	/**
	 * @throws \Exception
	 */
	private function getRedirectedTutaPath(IRequest $request): string
	{
		$pathInfo = $request->getRequestUri();
		$tutaPath = substr($pathInfo, strlen('/ocs/v2.php/apps/tutamail'));
		return $this->TUTA_SERVER_URL . $tutaPath;
	}


	public function wrapResponseFromTuta(IResponse $tutaResponse): DataDisplayResponse
	{
		$response = new DataDisplayResponse();
		$headers = [];
		foreach ($tutaResponse->getHeaders() as $key => $values) {
			foreach ($values as $value) {
				$headers[$key] = $value;
			}
		}

		return $response
				->setData($tutaResponse->getBody())
				->setHeaders($headers)
				// FIXME: Is this needed to be on response?
				->addHeader('X-TutaIntegrationPlatform', 'Nextcloud::v1')
				->setStatus($tutaResponse->getStatusCode());
	}

	/**
	 * Prepares the incoming request from the pluging to be forwarded to the Tuta server
	 * @param IRequest $request
	 * @return array
	 */
	public function makeTutaRequstOptions(IRequest $request): array
	{
		$options = ['http_errors' => false];

		// We transfer the whole url as it is in case of GET request.
		// see getRedirectedTutaPath
		if ($request->getMethod() !== 'GET') {
			$body = file_get_contents('php://input');
			$options['body'] = $body;
		}

		$headers = getallheaders();
		if ($headers === false) {
			throw new RuntimeException('Could not get request headers');
		}
		$headers['X-TutaIntegrationPlatform'] = 'Nextcloud::v1';
		unset($headers['OCS-APIRequest']);
		unset($headers['Cookie']);

		$options['headers'] = $headers;
		return $options;
	}

}