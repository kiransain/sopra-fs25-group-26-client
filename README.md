# 🕵️ Welcome to **Manhunt!**

![Vercel](https://vercelbadge.vercel.app/api/kiransain/sopra-fs25-group-26-client)
![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)

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
- Application needs running backend server. Ensure the backend is running (default: `http://localhost:8080`). You can configure the API base URL in `.env` using:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

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

### Main User Flow:
1. **Login/Register Page** - Login or register to the game
2. **Overview Page** – Entry point, see existing games  
3. **Join Game** – Browse and join open lobbies  
4. **Create Game** – Set game area, preparation and main timer 
5. **Game Lobby** – Wait for other players (minimum of 2 players required to start)
6. **Main Game** – Real-time map view, power-ups, role assignment   
7. **Endgame** – Automatically ends if all players are caught or time is up
8. **Global rankings** – Shows up under profile and you can compare yourself to all players.
    
[screenshots to be done]

----------

## 🛣️ Roadmap

Future contributors might consider:

1.  Customizable role assignment logic (e.g. several hunters)
2.  Adding support for team-based gameplay
3.  Limit available games to user’s current city (e.g., Zurich only)

----------

## 👥 Authors & Acknowledgments

- @kiransain
- @ermin-mumic
- @Gentjash
- And many thanks to our TA Ambros, the SoPra teaching team and the open-source tools we relied on.

----------

## 🌐 Related 

- 🔗 [Backend Repository](https://github.com/kiransain/sopra-fs25-group-26-server)
    
----------

## 📄 License

This project is licensed under the [MIT License](LICENSE).
