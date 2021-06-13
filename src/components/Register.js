import React, { useEffect, useState } from "react";
import firebase from "firebase/app";
import "./register.css";
import { Loading } from "../App";
import { useHistory } from "react-router";
import { eventKey } from "../config";

export default function Register() {
  const [busy, setBusy] = useState(true);
  const [events, setEvents] = useState([]);
  const history = useHistory();
  useEffect(() => {
    let db = firebase.firestore();
    let fetchEvents = () => {
      let ref = db.collection(eventKey);
      ref.get().then((snap) => {
        let events = [];
        snap.forEach((d) => {
          let item = d.data();
          events.push({
            id: d.id,
            name: item.name,
            color: item.color,
          });
        });
        setEvents(events);
        setBusy(false);
      });
    };
    fetchEvents();
  }, []);
  return (
    <div className="reg">
      {busy && <Loading />}
      {events.length > 0 && (
        <div className="reg-b">
          {events.map((e, i) => (
            <div
              className="reg-i"
              id={e.id}
              style={{ background: e.color }}
              key={i}
              onClick={() => history.push("/calendar/" + e.id)}
            >
              {e.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
