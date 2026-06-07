## Requirements

### Requirement: Automatic authentication mode detection
The client SHALL call `GET /auth/login` on initialization to detect the authentication type required by the Node-RED instance. If `NODERED_API_KEY` is defined in the environment, it SHALL skip detection and use the API key directly as a Bearer token.

#### Scenario: Instance with no authentication
- **WHEN** `GET /auth/login` returns `{}`
- **THEN** the client operates without an `Authorization` header in API calls

#### Scenario: Instance with standard credentials
- **WHEN** `GET /auth/login` returns `{ "type": "credentials", ... }`
- **THEN** the client proceeds to the token acquisition flow with user/pass

#### Scenario: API key defined (OIDC or other strategies)
- **WHEN** `NODERED_API_KEY` is defined in the environment
- **THEN** the client uses `Authorization: Bearer <NODERED_API_KEY>` directly without calling `/auth/login`

#### Scenario: Unknown auth type
- **WHEN** `GET /auth/login` returns an unsupported `type` and `NODERED_API_KEY` is not defined
- **THEN** the system throws a descriptive error suggesting to configure `NODERED_API_KEY`

### Requirement: Token acquisition with standard credentials
When the auth mode is `credentials`, the client SHALL call `POST /auth/token` with `client_id=node-red-admin`, `grant_type=password`, `scope=*`, and the configured credentials. The obtained token SHALL be stored in memory.

#### Scenario: Successful token acquisition
- **WHEN** the credentials are correct
- **THEN** the client stores the `access_token` and includes it in all subsequent calls as `Authorization: Bearer <token>`

#### Scenario: Incorrect credentials
- **WHEN** `POST /auth/token` returns an error
- **THEN** the system throws a descriptive error including the received status

### Requirement: Re-authentication on expired token
If an Admin API call returns `401 Unauthorized`, the client SHALL invalidate the in-memory token, re-authenticate with the original credentials, and retry the call once.

#### Scenario: Token expired during operation
- **WHEN** a call returns `401` and the mode is credentials
- **THEN** the client obtains a new token and retries the original call automatically

#### Scenario: Re-authentication failed
- **WHEN** the retry also returns `401`
- **THEN** the client propagates the error to the caller without further retries
