🥛 Dairy Management System (Pro)

A full-stack specialized ERP solution for dairy owners to manage customer records, milk collection, and automated rate calculations in real-time.
🚀 Live Demo Details

This project features a Role-Based Access Control (RBAC) system.

    Demo Access: dairypro.web.app

    Role: Reader (Read-Only)

🛡️ Security & Architecture

This project is built with a Security-First mindset to protect sensitive business data while allowing public demonstration.
1. Firestore Security Rules (RBAC)

The core of the application's security lies in the Firebase backend. I implemented custom rules to ensure:

    Write Protection: Only the primary Owner (UID validated) can Create, Update, or Delete records.

    Read-Only "Demo" Mode: Recruiters/Readers can view live data but are blocked from any modifications at the database level.

    Access Expiry: Integrated a hardcoded "Kill Switch" using Epoch timestamps to automatically revoke demo access on a specific date.

2. State-of-the-art Loading System

To handle the asynchronous nature of Firebase, I developed a Unified Loading Engine:

    Network Intelligence: Detects real-world internet connectivity (Ping check) vs. simple Wi-Fi connection.

    Connection Quality: Displays live signal strength (4G/3G/Offline) to the user.

    Auto-Retry: Includes a 10-second timeout logic with a manual "Try Again" trigger if data fetching hangs.

🛠️ Tech Stack

    Frontend: React.js, Tailwind CSS (Modern, High-Contrast UI)

    Backend/Database: Firebase Firestore (NoSQL)

    Authentication: Firebase Auth

    Icons: Lucide-React

    Environment Management: Vite-based .env configuration for secure API key handling.

✨ Key Features

    Daily Collections: Seamless input for Morning/Evening milk sessions.

    Dynamic Rate Cards: Automated price calculation based on custom parameters.

    Customer Management: Full CRUD for customer profiles with assigned reading permissions.

    Professional UI: Featuring a custom-branded loading screen with centered branding and progress indicators.

🧠 Technical Challenges & Solutions
    1. The "Ghost Connection" Problem

    Challenge: Standard web APIs like navigator.onLine only check if the device is connected to a router (Wi-Fi/LAN), not if that router actually has internet access. Users were seeing a "Syncing Data" spinner indefinitely when their Wi-Fi was connected but the internet was down.

    Solution: I engineered a custom Ping-Check Heartbeat.

        Real-time Monitoring: Instead of trusting the browser status, the app attempts to fetch a tiny 1px resource from a reliable external source every 5 seconds.

        Granular Feedback: If the ping fails, the UI instantly updates to "No Internet Access" even if the Wi-Fi icon is full.

        Auto-Retry Logic: Implemented a 10-second watchdog timer that triggers a "Retry" state, allowing users to manually refresh the connection once they’ve fixed their network.

    2. High-Performance RBAC (Role-Based Access Control)

    Challenge: Implementing a "Reader" role for recruiters while maintaining database performance. Standard Firebase rules can hit a "10-call limit" if they have to perform a lookup (get()) for every single document in a list.

    Solution: Optimized Security Rules.

        Lookup Minimization: I structured the security rules to perform a single top-level check on the dairyDetails collection.

        State Syncing: In the React frontend, I synchronized the AuthContext to identify the user's role immediately upon login, disabling "Write" actions in the UI before the database even has to block them.

    3. The "Double-Flicker" Loading Glitch

    Challenge: On page refresh, the app would briefly show a default browser loader, then a black screen, and then finally the custom LoadingScreen. This created a jarring user experience.

    Solution: State Synchronization.

        Initial State Lock: Set the AuthContext loading state to true by default so the custom loader is the very first thing the JavaScript engine renders.

        CSS Alignment: Synchronized the index.html background colors with the React component theme to ensure a seamless transition from the browser's initial paint to the application's first frame.

🏗️ Application Architecture Flow
    1. The Entry Layer (React Frontend)

        AuthContext: The "Gatekeeper." It checks the Firebase UID immediately.

        SubscriptionWrapper: Checks the hardcoded Epoch timestamp. If current_time > expiry_time, it redirects to an "Expired" screen.

        LoadingScreen: Monitors the "Ping" to Google. If the ping fails, it overrides the UI with a "No Internet" warning.

    2. The Security Layer (Firestore Rules)

    This is where your logic lives in the cloud. Think of it as three "Filters":

        Filter 1 (Authentication): is request.auth != null? (Blocks anonymous hackers).

        Filter 2 (Expiration): is request.time < expiry_time? (Blocks old demo accounts).

        Filter 3 (Authorization): * If Owner: Full CRUD (Create, Read, Update, Delete).

            If Reader: allow read only. (Blocks recruiters from deleting your real data).

    3. The Data Layer (Firestore NoSQL)

        dairyDetails/: Stores the link between the Owner and the Reader.

        customers/: Real-time customer profiles.

        dailyCollections/: The heart of the app (Milk records).

        rates/: Pricing logic.