# RankLand Upstream API Contract

## Normal API

| Method | HTTP path | Response |
| --- | --- | --- |
| `getStatistics` | `GET /statistics` | `{ totalSrkCount, totalViewCount }` |
| `listAllRanklists` | `GET /rank/listall` | `{ ranks }` |
| `searchRanklist` | `GET /rank/search?query=:kw` | `{ ranks }` |
| `getLiveRanklistInfo` | `GET /ranking/config/:uniqueKey` | live contest info |
| `getLiveRanklist` | `GET /ranking/:id` | SRK ranklist |

## CDN API

| Method | HTTP path | Response |
| --- | --- | --- |
| `getRanklistInfo` | `GET /rank/:key` | ranklist info |
| `getSrkFile` | `GET /file/download?id=:fileID` | SRK JSON |
| `getCollection` | `GET /rank/group/:key` | `{ content: stringifiedCollectionJson }` |

## Error Mapping

| Upstream condition | Target behavior |
| --- | --- |
| Wrapped response `code === 0` | Return `data` |
| Wrapped response `code === 11` | Throw RankLand NotFound logic exception |
| HTTP `404` | Throw RankLand NotFound logic exception |
| Other wrapped API error | Throw API exception with code and message |
| Other HTTP error | Throw HTTP exception with status and status text |
