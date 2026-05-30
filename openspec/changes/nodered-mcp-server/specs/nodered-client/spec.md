## ADDED Requirements

### Requirement: Generic HTTP client for the Node-RED Admin API
The system SHALL provide an HTTP client that wraps native fetch for all calls to the Node-RED Admin API. The client SHALL automatically include the `Node-RED-API-Version: v2` header and the `Authorization` header when appropriate based on the active auth mode.

#### Scenario: Authenticated GET call
- **WHEN** a GET call is made with auth configured
- **THEN** the request includes `Authorization: Bearer <token>` and `Node-RED-API-Version: v2`

#### Scenario: Unauthenticated GET call
- **WHEN** the Node-RED instance requires no auth
- **THEN** the request does not include `Authorization` but does include `Node-RED-API-Version: v2`

### Requirement: HTTP error handling
The client SHALL throw a descriptive error (method, URL, status code, body) when the HTTP response is not successful (status >= 400), except for 401 which is handled by the auth layer.

#### Scenario: Non-401 HTTP error
- **WHEN** the Admin API returns status 404 or 500
- **THEN** the client throws an Error with a message including method, URL and status code

#### Scenario: Successful response
- **WHEN** the Admin API returns status 2xx
- **THEN** the client returns the body parsed as JSON
