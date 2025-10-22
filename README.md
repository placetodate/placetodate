# React Firebase Google Auth

This project demonstrates a basic React application connected to Firebase with Google login.

## Setup Instructions

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Firebase Project Setup:**

    a.  Go to the [Firebase Console](https://console.firebase.google.com/).
    b.  Create a new Firebase project.
    c.  Add a new web app to your project.
    d.  Copy your Firebase configuration.

3.  **Update Firebase Configuration:**

    Create a file named `src/firebaseConfig.ts` and add your Firebase configuration:

    ```typescript
    import { initializeApp } from 'firebase/app';
    import { getAuth, GoogleAuthProvider } from 'firebase/auth';

    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();

    export { auth, googleProvider };
    ```

    Replace the placeholder values (`YOUR_API_KEY`, etc.) with your actual Firebase configuration.

4.  **Enable Google Authentication:**

    a.  In the Firebase Console, navigate to "Authentication" > "Sign-in method".
    b.  Enable the "Google" sign-in provider.

5.  **Run the Application:**

    ```bash
    npm start
    ```

    The application will open in your browser, and you can test the Google login functionality.
