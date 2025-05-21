# 🕵️ Welcome to **Manhunt!**

## 🎯 Introduction

**Manhunt** is a location-based mobile web game that combines the thrill of _hide-and-seek_ with game mechanics inspired by _Fortnite_. Our goal is to encourage players to go outside and have fun while using the benefits of modern mobile technology and GPS.

The app allows players to join or create real-time location-based games, play as a hider or hunter, use power-ups, and compete for top rankings on a global leaderboard.

----------

## ⚙️ Technologies Used
-   **Frontend:** TypeScript, React, CSS
-   **Backend:** Spring Boot (Java), RESTful APIs
-  **External API** Google Maps API
-   **Database:** H2 (in-memory for dev/testing), PostgreSQL (for deployment)
-   **Deployment:** Google Cloud (Backend), Vercel (Frontend)
----------

## 🧩 High-Level Components

1.  **Frontend App (`client/`)**
    -   Built with Typescript, React, and CSS        
    -   Responsible for the UI, maps, and live game display       
    -   Main file
        
2.  **Backend Server (`server/`)**
    -   Built with Spring Boot
    -   Manages user accounts, games, leaderboards, and game logic
    -   Main class
        
3.  **Game Engine**
       -   Coordinates game logic (e.g., player roles, timers, area shrinking)
       -   Handles GPS data and location-based game states
       -   Example file
        
4.  **Authentication & User Management**
    -   Login, registration, profile handling, and secure password update
    -   Example file
        
5.  **Map & Location Integration**
    -   Uses browser geolocation and dynamic map rendering
    -   Enforces game boundaries and out-of-bounds logic
    -  Uses Google Maps API        
----------

## 🚀 Launch & Deployment

### Prerequisites
-   Java 17+
-   Node.js 18+
-   PostgreSQL or H2

### Backend (Spring Boot)
`cd server`
`./gradlew build` 
`./gradlew bootRun` 

### Frontend (React)
`cd client`
`npm install`
`npm run dev` 

### Running Tests
-   Backend tests: `./gradlew test`

### Deployment
-   Backend: Deployed on Google Cloud App Engine
-   Frontend: Deployed via Vercel (automatic on `main` branch push)
    
----------

## 🖼️ Illustrations

### Main User Flow:
1.  **Overview Page** – Entry point, see existing games  
2.  **Join Game** – Browse and join open lobbies  
3.  **Create Game** – Set game area, preparation and main timer 
4.  **Game Lobby** – Wait for other players (min. 2 to start)
5.  **Main Game** – Real-time map view, power-ups, role assignment   
6.  **Endgame** – Automatically ends if all players are caught or time is up
7.  **Global rankings** – Shows up under profile and you can compare yourself to all players.
    

### Key UI Features:

-   **Player markers** (red = hunter, green = hider)
-   **Power-ups** (see players, shrink area)
-   **Out-of-bounds warning & auto-elimination**
-   **Global leaderboard and personal stats**
    
[screenshots to be done]

----------

## 🛣️ Roadmap

Future contributors might consider:

1.  Customizable role assignment logic (e.g. several hunters)
2.  Adding support for team-based gameplay
3.  Only location-based games available (e.g. only games in Zurich available)

----------

## 👥 Authors & Acknowledgments

- @kiransain
- @ermin-mumic
- @Gentjash
- And many thanks to our TA Ambros, the SoPra teaching team, and the open-source tools we relied on.


    
----------

## 📄 License

This project is licensed under the [MIT License](LICENSE).
