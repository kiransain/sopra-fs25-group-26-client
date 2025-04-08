# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - 25.03.2025 to 01.04.2025

| **Student**        | **Date**         | **Link to Commit**                                                                                                                     | **Description**                                                                                                                                                                | **Relevance**                       |
|--------------------|------------------|----------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| ----------------------------------- |
| **@ermin-mumic**   | 29.03.2025       | [Repositories and Entities](https://github.com/kiransain/sopra-fs25-group-26-server/commit/3fdeda19478707ef7999d495fcddf89ce445b867)   | Created and configured the Game, Player, and updated User entities. Implemented their corresponding JPA repositories to enable database operations for each entity.            | Defined the core entities (Game, Player, User) and their repositories, forming the foundation for all game and user interactions in the backend. |
| **@ermin-mumic**   | 29.03.2025       | [Registration logic](https://github.com/kiransain/sopra-fs25-group-26-server/commit/1235911949d6885c0cf7747ab63e05776520c533)          | Implemented user registration logic, including saving new users to the database with a generated token and initial stats as well as handling error for already taken usernames. | Enables user account creation and authentication, which is essential for tracking players and managing game participation. |
| **@ermin-mumic**   | 31.03.2025       | [Login logic](https://github.com/kiransain/sopra-fs25-group-26-server/commit/c5d4b4befab3761829fe582786e915fcecb48a21 )                | Added endpoint to validate user credentials and return the stored token upon successful login.                                                                                 | Enables secure user login and token-based authentication, which is required to protect routes and link actions to specific users. |
| **@ermin-mumic**   | 31.03.2025       | [Game creation logic](https://github.com/kiransain/sopra-fs25-group-26-server/commit/405fb3652cdc319129e3e7baf2172246b42bc092 )        | Implemented logic to create a game and automatically register the creator as a player with location and role while handling error cases.                                       | Allows users to create games and participate as players, enabling the core gameplay flow of ManHunt. |
| **@kiransain**     | 28.03.2025       | [Google Maps API Integration](https://github.com/kiransain/sopra-fs25-group-26-client/commit/addd68fdf76c7d0c3f622eb009c10a9eed06552c) | Google Maps API is integrated into the front end to be accessible from Vercel and localhost.                                                                                   | Relevant so that all of us can test and see what we coded locally as well as on Vercel because before, only Vercel or localhost worked but not both. So important for work. |
| **@kiransain**     | 27.03.2025       | [API Key storage](https://github.com/kiransain/sopra-fs25-group-26-client/commit/302846df3197b021c8cab878a3d6a08cb05e165e )            | The API key is securely stored and not visible on the front end.                                                                                                               | This is very important due to security issues - the API key should not be exposed and kept safely on the backend. |
 **@gentjash**      | 27.03.2025]      | [Map Marker](https://github.com/kiransain/sopra-fs25-group-26-client/commit/5382993884117153954c65fae3847ee697fd554d)                  | [Adjusted map and implemented moving marker by updating user position]                                                                                                         | High priority task since map is fundamental |
| **@gentjash**      | 30.03.2025  | [Game area & Libraries](https://github.com/kiransain/sopra-fs25-group-26-client/commit/6908dac4811ab100c35f92d33bb9d4a1f96b423c)       | [ implemented the radius and changed libraries]                                                                                                                                | the circle is a critical part of the game |                                                                                                      | 
| **[@githubUser4]** | [date]           | [Link to Commit 1]                                                                                                                     | [Brief description of the task]                                                                                                                                                | [Why this contribution is relevant] |
|                    | [date]           | [Link to Commit 2]                                                                                                                     | [Brief description of the task]                                                                                                                                                | [Why this contribution is relevant] |

---

## Contributions Week 2 - 01.04.2025 to 08.04.2025

| **Student**        | **Date**    | **Link to Commit**                                                                                                                                                            | **Description**                                                                                                                                                                                                                                                                         | **Relevance**                                                                                                                                                                                                                                             |
| ------------------ |-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **@ermin-mumic** | [06.04.2025 | [REST Mapping to get joinable games](https://github.com/kiransain/sopra-fs25-group-26-server/commit/3854b9291a71f5e08efdf24007fbd6e20e27a953)                                 | Created a REST endpoint that retrieves only joinable games from the backend. This mapping filters games by their status, ensuring that clients receive a list of active, available games for players to join.                                                                           | It ensures that players see only games they can join, improving user experience and system efficiency.                                                                                                                                                    |
| **@ermin-mumic**         | 06.04.2025  | [REST Mapping to fetch user data](https://github.com/kiransain/sopra-fs25-group-26-server/commit/1493a5704626a14ce85cbac3f77f768a6cf396e7)                                    | The endpoint retrieves the user’s information from the database, maps the User entity to a UserGetDTO, and returns it after authenticating the request.                                                                                                                                 | This endpoint is essential for providing users access to their personal profile information.                                                                                                                                                              |
| **@ermin-mumic**  | 06.04.2025  | [REST Mapping to join game](https://github.com/kiransain/sopra-fs25-group-26-server/commit/f835a7d85322af6a9265a0925e3c5a75129a5989)                                          | Implemented the server logic and REST mapping for joining a game. This logic checks if the game is joinable (in lobby and with fewer than 5 players) and if the user isn’t already a player, then adds them as a new player, or updates their location if they are already in the game. | This feature is key for managing game participation. It ensures that only valid joinable games are accessible and enforces player count limits.                                                                                                           |
|  **@ermin-mumic**          | 07.04.2025  | [REST Mapping to retrieve players, start a game and update location](https://github.com/kiransain/sopra-fs25-group-26-server/commit/0623f7db6287ea733d4c8af54b1d2bbe0ca55f88) | Implemented polling-based logic to update player locations every 3 seconds and allow the game creator to start the game, changing its status appropriately and assigning roles. Aswell as a REST endpoint to retrieve all players in a game.                                            | The polling mechanism ensures real-time location updates for each player, while allowing only the creator to start the game. Retrieving players is essential for tracking and displaying active participants in each game. |
[@kiransain] |05.04.2025  | [Log out button created + centered](https://github.com/kiransain/sopra-fs25-group-26-client/commit/99e00b15a38abe472373004d5cb219ac18a8f9dc) | [A user has to be able to logout from the main page, if they don't want to play or have finished their game.] | [Anywhere where you log in, you must be able to log out.] |
|                    | 05.04.2025   | [No commit for this - it was changing the github on web.](https://github.com/kiransain/sopra-fs25-group-26-server/issues/97) | [I manually updated all subtasks of our Sprint1 user stories to either To do/In progress/Done + added the relevant milestone as per feedback of our TA.] | [It was recommended by our TA + in our M2 review mail, so that us devs have a better overview of who is doing what and to avoid clashes. In simple: better productivity.] |
| **[@GentJash]** |  04.04.2025     | [https://github.com/kiransain/sopra-fs25-group-26-client/commit/fa8e47610ef1880c37f9d24935b2f26587c682c5]                                                                                                                                                            | [Implemented login page, new personalized css files for every page,logo design and page design]                                                                                                                                                                                                                                                         | [We need login page for basic user registration logic and the design to have a constant design across all the pages]                                                                                                                                                                                                                       |
|                    | 04.04.2025      | [https://github.com/kiransain/sopra-fs25-group-26-client/commit/e756f75b3ff3946769998f6824bf6a0f5d7bd850]                                                                                                                                                            | [Implemented a registration page with a confirm password input and made the necessary API requests to the backend]                                                                                                                                                                                                                                                         | [Registration page is a also a necessary and basic feature of the application]                                                                                                                                                                                                                       |
| **[@githubUser4]** | [date]      | [Link to Commit 1]                                                                                                                                                            | [Brief description of the task]                                                                                                                                                                                                                                                         | [Why this contribution is relevant]                                                                                                                                                                                                                       |
|                    | [date]      | [Link to Commit 2]                                                                                                                                                            | [Brief description of the task]                                                                                                                                                                                                                                                         | [Why this contribution is relevant]                                                                                                                                                                                                                       |

---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
