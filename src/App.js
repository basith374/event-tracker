import React, { useState, useEffect } from "react";
import "./App.css";
import Register from "./components/Register";
import Calendar from "./components/Calendar";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { Route, BrowserRouter as Router, Switch } from "react-router-dom";

function useAuth() {
  const [auth, setAuth] = useState(false);
  useEffect(() => {
    firebase.auth().onAuthStateChanged((auth) => {
      if (auth) {
        setAuth(true);
      } else {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase
          .auth()
          .signInWithRedirect(provider)
          .then((result) => {
            setAuth(true);
          })
          .catch((error) => {});
      }
    });
  }, []);
  return auth;
}

export function Loading() {
  return (
    <div className="ld">
      <div></div>
    </div>
  );
}

function Content() {
  return (
    <div className="App-view">
      <Switch>
        <Route path="/calendar/:event">
          <Calendar />
        </Route>
        <Route path="/">
          <Register />
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  const auth = useAuth();
  return (
    <div className="App">
      <Router>{auth ? <Content /> : <Loading />}</Router>
    </div>
  );
}

export default App;
