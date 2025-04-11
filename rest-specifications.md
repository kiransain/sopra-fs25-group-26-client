**DTO Notes:** 

- `UserPostDTO`: Requires `username`(string), `password`(string).
- `UserGetDTO`: Contains `userId`(long), `username`(string), `token`(string), `stats`(Map<String, String>).
- `GamePostDTO`: Requires `gamename`(string), `locationLat`(double), `locationLong`(double).
- `GamePutDTO`: Requires `locationLat`(double), `locationLong`(double, `startGame`(boolean).
- `GameGetDTO`: Contains `gameId`(long), `gamename`(string), `status`(GameStatus), `centerLatitude`(double), `centerLongitude`(double), `radius`(double), `creatorId` (long = playerId), `players` (List<PlayerGetDTO>), `timer` (LocalDateTime).
- `PlayerGetDTO`: Contains `playerId`(long), `userId`(long),  `role`(PlayerRole), `status`(PlayerStatus), `locationLat`(double), `locationLong`(double))

---

**User Endpoints**

|            |                   |                                                            |                    |                    |                                                                    |                                                                                      |
| ---------- | ----------------- | ---------------------------------------------------------- | ------------------ | ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Method** | **Mapping**       | **Parameters (Type)**                                      | **Success Status** | **Response Body**  | **Description**                                                    | **Potential Errors**                                                                 |
| POST       | `/users`          | Body: `UserPostDTO`                                        | 201 CREATED        | `UserGetDTO`       | Register a new user.                                               | 409 CONFLICT (Username exists)                                                       |
| POST       | `/login`          | Body: `UserPostDTO`                                        | 202 ACCEPTED       | `UserGetDTO`       | Log in a user.                                                     | 401 UNAUTHORIZED (Invalid credentials)                                               |
| GET        | `/users`          | _(None)_                                                   | 200 OK             | `List<UserGetDTO>` | Get a list of all users. _(No authentication shown in code)_       |                                                                                      |
| GET        | `/users/{userId}` | Path: `userId` (Long)<br/>Header: `Authorization` (String) | 200 OK             | `UserGetDTO`       | Get user profile (only works if requested `userId` matches token). | 401 UNAUTHORIZED (Invalid token)<br/>404 NOT FOUND (Not own profile / User mismatch) |

**Game Endpoints**

|            |                                      |                                                                                             |                    |                      |                                                                 |                                                                                                                                                                                                                         |
|------------| ------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------ | -------------------- |-----------------------------------------------------------------| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Method** | **Mapping**                          | **Parameters (Type)**                                                                       | **Success Status** | **Response Body**    | **Description**                                                 | **Potential Errors**                                                                                                                                                                                                    |
| POST       | `/games`                             | Body: `GamePostDTO`<br/>Header: `Authorization` (String)                                    | 201 CREATED        | `GameGetDTO`         | Create a new game. Creator is added as first player.            | 401 UNAUTHORIZED (Invalid token)<br/>409 CONFLICT (Gamename exists)<br/>409 CONFLICT (User is already a Player)                                                                                                         |
| GET        | `/games`                             | Header: `Authorization` (String)                                                            | 200 OK             | `List<GameGetDTO>`   | Get a list of joinable games (status IN_LOBBY).(polling method) | 401 UNAUTHORIZED (Invalid token)                                                                                                                                                                                        |
| PUT        | `/games/{gameId}`                    | Path: `gameId` (Long)<br/>Body: `GamePutDTO`<br/>Header: `Authorization` (String)           | 200 OK             | `GameGetDTO`         | start game, join game and update location (polling method)      | 401 UNAUTHORIZED (Invalid token)<br/>404 NOT FOUND (Game not found)<br/>403 FORBIDDEN (Game full / Not creator / Not enough players)                                                                                    |
