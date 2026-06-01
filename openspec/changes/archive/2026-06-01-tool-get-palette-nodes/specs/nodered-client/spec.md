## ADDED Requirements

### Requirement: requestText method for non-JSON responses
The HTTP client SHALL expose a `requestText(method, path)` method that calls the Node-RED Admin API without forcing `Accept: application/json` and returns the raw response body as a string. It SHALL include the same `Authorization` and `Node-RED-API-Version: v2` headers as `request()`, and SHALL throw a descriptive error on non-2xx responses (including 401 retry logic).

#### Scenario: Successful text response
- **WHEN** `requestText('GET', '/nodes')` is called
- **THEN** the response body is returned as a raw string without JSON parsing

#### Scenario: Authentication headers included
- **WHEN** auth is configured and `requestText` is called
- **THEN** the request includes `Authorization: Bearer <token>` and `Node-RED-API-Version: v2`

#### Scenario: Error on non-2xx response
- **WHEN** the Admin API returns status 404 or 500
- **THEN** `requestText` throws a descriptive error matching the behaviour of `request()`
