import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDKEjPaTHzz34zzoCQ3cnf2J9ZPYisDEUw",
  authDomain: "test-9f9cf.firebaseapp.com",
  databaseURL: "https://test-9f9cf-default-rtdb.firebaseio.com",
  projectId: "test-9f9cf",
  storageBucket: "test-9f9cf.appspot.com",
  messagingSenderId: "1091599040625",
  appId: "1:1091599040625:web:ac826c13679479af1b9bd0",
  measurementId: "G-264T6KYH85"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  console.log('Firebase already initialized');
}

const database = firebase.database();
const storage = firebase.storage();
const app = firebase.app();

export { database, storage, app };
export default { database, storage, app };