import React, { useState, useEffect } from 'react';
import './App.css';
import Register from './components/Register';
import Calendar from './components/Calendar';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

function App() {
  let [tab, setTab] = useState('register');
  let [event, setEvent] = useState('');
  let [events, setEvents] = useState([]);
  let [busy, setBusy] = useState(true);
  let db = firebase.firestore();
  let fetchEvents = () => {
    let collectionKey = 'foo';
    let ref = db.collection(collectionKey);
    ref.get().then(snap => {
      let events = [];
      snap.forEach(d => {
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
  }
  useEffect(() => {
    window.onpopstate = () => {
      let _tab = 'register'
      setTab(_tab);
    }
    fetchEvents();
  }, []);
  let openEvent = (event) => {
    setEvent(event);
    setTab('calendar');
  }
  useEffect(() => {
    let tabs = [
      'calendar',
    ];
    if(tabs.includes(tab)) window.history.pushState({}, '', '');
  }, [tab]);
  let showApp = () => {
    if(tab === 'register') return <Register
      busy={busy}
      setEvent={openEvent}
      events={events}
      event={event} />
    if(tab === 'calendar') return <Calendar event={event} setEvent={setEvent} />
    return null;
  }
  return (
    <div className="App">
      <div className="App-view">
        {showApp()}
      </div>
    </div>
  );
}

export default App;
