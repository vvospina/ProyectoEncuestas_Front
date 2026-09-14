import { initializeApp } from "firebase/app";

export const environment = {
  production: false,
  devForceRole: 'ADMIN', // Cambia a 'USER' o quítalo según necesites 
  bypassAuthForDev: true,
  firebaseConfig: {
    apiKey: "AIzaSyBXwLgD6-xxiVyItLfymquu6iWVHs2ZNEk",
    authDomain: "encuestas-ue-dfe44.firebaseapp.com",
    projectId: "encuestas-ue-dfe44",
    storageBucket: "encuestas-ue-dfe44.firebasestorage.app",
    messagingSenderId: "172164543525",
    appId: "1:172164543525:web:1aadcbbf7ffed538f9bbcc"
  }
};

// Inicialización opcional si inicializas Firebase en el archivo de environment
export const app = initializeApp(environment.firebaseConfig);