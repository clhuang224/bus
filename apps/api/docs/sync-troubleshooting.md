# Sync Troubleshooting

This document records sync issues that were observed while importing TDX bus
base data.

## Stop Sync Fails With Query Parameter Limit

Error example:

```text
The query parameter limit supported by your database is exceeded.
```

Cause:

The first stop sync implementation used a large `notIn` filter to deactivate
local rows that were missing from the latest TDX response.

For large cities, the incoming stop UUID list can contain tens of thousands of
values. Passing that list as one SQL query can exceed the database query
parameter limit.

Current handling:

- Load currently active local UUIDs for the city.
- Compare them with incoming TDX UUIDs in application code.
- Deactivate missing rows with smaller batched `in` updates.

This pattern is used for:

- station groups
- stations
- stops

## Stop Sync Fails With `ON CONFLICT DO UPDATE`

Error example:

```text
ON CONFLICT DO UPDATE command cannot affect row a second time
```

Cause:

PostgreSQL can handle rows that conflict with existing database rows, but one
bulk `INSERT ... ON CONFLICT DO UPDATE` statement cannot update the same target
row more than once.

This can happen when the TDX response contains duplicate records for the same
database conflict key inside one bulk batch.

Current handling:

`StopBulkWriterService` deduplicates records before running raw SQL upserts.
The latest record in the same batch wins.

Conflict keys:

| Sync stage      | Conflict key               |
| --------------- | -------------------------- |
| station groups  | `uuid`                     |
| stations        | `uuid`                     |
| stops           | `uuid`                     |
| route stops     | `subroute_id` + `sequence` |
| route shapes    | `subroute_id`              |

Duplicate rows are dropped silently for now. If this becomes hard to debug, add
targeted logging with small samples instead of logging every duplicate row.

## TDX Endpoint City Support Differs By Resource

Error example:

```text
TDX request failed: 400 /api/basic/v2/Bus/Station/City/LienchiangCounty:
{"Message":"City: 'LienchiangCounty' is not accepted but ..."}
```

Cause:

TDX bus endpoints do not all support the same city list. A city can be valid for
one resource but rejected by another resource.

Observed examples:

- `StationGroup/City` does not support every city. Taipei and NewTaipei are
  skipped for station groups during stop sync.
- `Station/City` does not support LienchiangCounty. Stop sync skips station
  import for LienchiangCounty and continues with stops, route stops, and route
  shapes.

Current handling:

- Keep the unsupported-city logic close to the sync orchestration code.
- Treat unsupported optional resources as a skip, not a failed sync.
- Keep required resources strict. For example, an empty stop response still
  fails fast because stop sync cannot be useful without stops.

When adding another TDX resource, check the Swagger accepted city list before
assuming all 22 cities are supported.

## TDX StopOfRoute Can Duplicate One Subroute By Operator

Observed TDX example:

```text
GET /v2/Bus/StopOfRoute/City/YilanCounty
```

Filtered by:

```text
SubRouteUID eq 'ILA011201'
```

TDX returned two records with the same route and subroute identity:

```text
RouteUID: ILA0112
RouteName: 112
SubRouteUID: ILA011201
Direction: 0
City: YilanCounty
```

The difference was the operator:

| OperatorID | OperatorName |
| ---------- | ------------ |
| `35`       | 葛瑪蘭客運   |
| `39`       | 首都客運     |

Both records contained the same stop sequence. For example, both started with:

```text
StopUID: ILA296014
StopName: 礁溪轉運站
StopSequence: 1
StationID: 133177
```

The API mapper converts `SubRouteUID + Direction` into the local subroute UUID:

```text
ILA011201 + 0 -> ILA011201-0
```

After flattening `Stops[]`, the two TDX records become duplicate local route
stops:

```text
subroute_uuid: ILA011201-0
sequence: 1
```

The route stop table intentionally stores only one row per subroute sequence, so
the duplicate TDX rows are deduplicated before writing to the database.
