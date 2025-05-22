# 🕵️ Welcome to **Manhunt!**

## 🎯 Introduction

**Manhunt** is a mobile, multiplayer web application that reimagines classic hide-and-seek for the smartphone era. By blending real-world movement with battle‐royale–style dynamics, it brings back a nostalgic childhood game in a modern, enhanced form—making playing outside fun again.

Players join or create a game as either **<span style="color:#722ed1">Hunter</span>** or **<span style="color:#fadb14">Hider</span>**, then physically move within a geo-fenced play area that dynamically shrinks. Strategic power-ups—**Reveal** (briefly expose all players) and **Recenter** (shift the game center)—add tactical depth. All clients remain tightly synchronized—sharing GPS positions, player statuses, and a server-anchored countdown—to ensure fairness and eliminate boundary or timing disputes.

**Motivation**
- Rekindle the joy of a nostalgic outdoor game with modern technology  
- Solve childhood hide-and-seek frustrations (lost players, boundary disputes, unfair starts)  
- Encourage physical activity, social interaction and strategic thinking  
- Offer quick, repeatable rounds with clear rules and engaging mechanics

----------

## ⚙️ Technologies Used
- **Framework:** Next.js & React (TypeScript)
- **UI Library:** Ant Design
- **Styling:** CSS Modules
- **Animations:** Framer Motion
- **APIs:** Google Maps JavaScript API
- **Testing & Quality:** ESLint
- **Deployment:** Vercel
---------- 

## 🧩 High-Level Components

1. **Pages**
   - **Role:** Serve as the main entry points for each URL route, defining layout and page logic.
   - **Correlations:**  
     - Import and render UI **Components** for page-specific views.  
     - Use **Hooks** to obtain data and manage states.  
     - Call **API Service** methods to retrieve and update backend data.
   - **Main File:**
   [games/[gameId]/[playerId]/page](app/games/%5BgameId%5D/%5BplayerId%5D/page.tsx)

2. **Components**
    - **Role:** Encapsulate shared UI elements for map integration, including the provider and the map renderer.
    - **Correlations:**
        - Imported by **Pages** to display the game map.
        - **GoogleMapsProvider** uses a 'useEffect' hook to fetch and initialize the Google Maps API key on mount.
        - **MapComponent** consumes the provider's context to render the map, player markers and game area circle.
        - Styles are applied via CSS modules in the **Styles**.
   - **Main File:**
   [GoogleMapsProvider](app/components/GoogleMapsProvider.tsx)

3. **API Service**
   - **Role:** Centralize all HTTP communication with the backend REST API.
   - **Correlations:**  
     - Invoked by **Pages** and **Hooks** to fetch or mutate game and user data.  
     - Returns JSON payloads that are passed into **Components** for rendering.
   - **Main File:**
   [apiService](app/api/apiService.ts)

4. **Hooks**
   - **Role:** Provide shared logic (e.g., geolocation, audio playback, polling) as reusable React hooks.
   - **Correlations:**  
     - Employed in **Pages** and **Components** to abstract side effects and stateful logic.  
     - Rely on **API Service** to fetch data where needed.
   - **Main File:**
   [useGoogleMaps](app/hooks/useGoogleMaps.ts)

5. **Styles**
   - **Role:** Define the visual theming and layout using scoped CSS Modules.
   - **Correlations:**  
     - Imported by **Pages** and **Components** to ensure consistent styling across the app.
   - **Main File:**
   [game-play](app/styles/game-play.css)
---------- 

## 🚀 Launch & Deployment

Prerequisites
- Node.js 18+
- npm 9+
- -**Browser Location:** Ensure that your browser has location services enabled otherwise the game functions will not work.


Clone the Repository
```bash
git clone git@github.com:kiransain/sopra-fs25-group-26-client.git
cd sopra-fs25-group-26-client

# Install Dependencies
npm install
```

Local Development
```bash
npm run dev
```

Production Build
```bash
npm run build
npm start
```

External Dependencies
- Application needs running backend server. Make sure the backend is running on `localhost:8080` or change the API URL in the `.env` file.
- Google Maps API key is required. Set it in the `.env` file as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key`.

Deployment
- The frontend is automatically deployed to Vercel on pushes to the `main` branch.

Releases
- Make sure changes are committed and pushed to the 'develop' branch.
- Create a pull request to merge 'develop' into 'main'.
- After code review and approval, merge the pull request.
- Create a new tag for the release version and push it.
- Vercel will automatically deploy the latest version to production.


---------- 

## 🖼️ Illustrations

### Main User Flows:
1.**Login/Register Page** - The main entry point, where users login or register to access the app.

<img src="public/screenshots/login.jpg" alt="Login Page" width="200" />

2.**Overview Page** – The hub, where users can see all active game lobbies, join them or create a new one. Additionally, users can view their profile and global rankings by clicking on the profile icon in the top right corner or read about the rules in the information section.

<img src="public/screenshots/overview.jpg" alt="Overview Page" width="200" />

3.**Create Game** – The creator sets the game parameters. After successfully creating a game, the user is redirected to the game lobby.

<img src="public/screenshots/create_game.jpg" alt="Create Game Page" width="200" />

4.**Game Lobby** – All players gather here before the game starts. The creator can start the game, and all players can leave the lobby.

<img src="public/screenshots/lobby.jpg" alt="Game Lobby Page" width="200" />

5.**Main Game in Preparation** – The game is in preparation mode. Players can see their updated realtime location on the map, their roles and the game area. The main game starts when the countdown reaches zero.

<img src="public/screenshots/main-game-preparation.jpg" alt="Game in Preparation Page" width="200" />

6.**Main Game in Progress** – The game is in progress. Players can additionally see their role-specific power ups. Hiders also have a 'caught' button to admit they are caught. Players outside of the game area have 10 seconds to return into the game area otherwise they are out. The game ends when the countdown reaches zero, all hiders were caught or the hunter it out due the out-of-area penalty.

<img src="public/screenshots/main-game.jpg" alt="Game in Progress" width="200" />

7.**Game End** – The game ends. Players can see the results and their roles. Players are awarded with points based on their performance and can return to the overview page.

<img src="public/screenshots/leaderboard.jpg" alt="Game End Page" width="200" />

8.**Profile Page** – The profile page shows the player's statistics, including the number of games played, won and lost and their points. From here users can access the global leaderboard, update their password or log out.

<img src="public/screenshots/profile.jpg" alt="Profile Page" width="200" />

9.**Global Leaderboard** – The global leaderboard shows all users ranked based on their points. Players can see their rank and the rank of other players.

<img src="public/screenshots/global-leaderboard.jpg" alt="Leaderboard Page" width="200" />

----------

## 🛣️ Roadmap

Future contributors might consider:

1. Add forms in newgame/page.tsx to allow player customize roles and teams.
2. Allow custom profile pictures uploaded by users.

----------

## 👥 Authors & Acknowledgments

- @kiransain
- @ermin-mumic
- @Gentjash
- And many thanks to our TA Ambros, the SoPra teaching team and the open-source tools we relied on.


    
----------

## 📄 License

This project is licensed under the [MIT License](LICENSE).
