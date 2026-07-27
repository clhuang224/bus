# API Error Handling

All non-204 API responses use the shared response envelope.

Successful responses:

```json
{
  "status": 200,
  "message": null,
  "data": {}
}
```

Error responses:

```json
{
  "status": 400,
  "error": {
    "code": "SYSTEM_BAD_REQUEST",
    "message": "請確認輸入資料是否正確。"
  }
}
```

`error.message` is a single localized string selected from the request
`Accept-Language` header. The API supports the locale tags `zh-TW` and `en`
(case-insensitive); missing or unsupported preferences fall back to `zh-TW`.
Clients should use `error.code` for programmatic handling.
Explicit custom messages supplied by a domain error are returned unchanged.

## Headers

| Header                          | Direction | Required       | Purpose                                                                      |
| ------------------------------- | --------- | -------------- | ---------------------------------------------------------------------------- |
| `Accept-Language`               | Request   | No             | Selects `error.message`; supports `zh-TW` and `en`, with a `zh-TW` fallback. |
| `Content-Type: application/json` | Request  | JSON body only | Identifies a JSON request body.                                              |
| `Content-Type: application/json` | Response | Yes, except 204 | Identifies the JSON response body.                                         |
| `Vary: Accept-Language`         | Response  | Localized errors | Prevents shared caches from serving an error message selected for another language. |

The admin API key is documented on the admin endpoint group because it does not
apply to every API request.

## Common Errors

These errors can happen across the API and are documented globally instead of
being repeated on every endpoint in Scalar.

| HTTP status | Error code                     | Meaning                                                                  |
| ----------- | ------------------------------ | ------------------------------------------------------------------------ |
| 400         | `SYSTEM_BAD_REQUEST`           | Request validation, query parsing, or body parsing failed.               |
| 401         | `SYSTEM_UNAUTHORIZED`          | Authentication or an admin API key is required.                          |
| 403         | `SYSTEM_FORBIDDEN`             | The caller is authenticated but not allowed to perform the action.       |
| 404         | `SYSTEM_NOT_FOUND`             | The requested API path does not exist, or a generic resource is missing. |
| 409         | `SYSTEM_CONFLICT`              | The request conflicts with the current resource or sync state.           |
| 500         | `SYSTEM_INTERNAL_SERVER_ERROR` | Unexpected server error.                                                 |

## Endpoint-Specific Errors

Endpoint-specific errors are still documented on the endpoint itself when they
carry domain meaning that clients may handle differently.

Examples:

- `GET /api/routes/{uuid}` can return `ROUTE_NOT_FOUND` when the route UUID is
  missing or inactive.
- `GET /api/admin/sync/runs/{uuid}` can return `SYSTEM_NOT_FOUND` when the sync
  run UUID does not exist.

## Rate Limiting

The API does not currently document or emit a 429 response. Add a rate-limit
error code and Scalar documentation when realtime polling or public deployment
needs an explicit rate limit.
