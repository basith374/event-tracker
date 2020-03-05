import React, { useState, useEffect } from 'react';
import './App.css';
import Register from './components/Register';
import Calendar from './components/Calendar';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { eventKey } from './config';
import Create from './components/Create';
import ColorPicker from './components/ColorPicker';
import DeleteModal from './components/DeleteModal';
import Login from './components/Login';

function App() {
  let [tab, setTab] = useState('register');
  let [event, setEvent] = useState([]);
  let localUser = localStorage.getItem('user');
  let [events, setEvents] = useState([]);
  let [user, setUser] = useState(localUser || '');
  let [busy, setBusy] = useState(true);
  let db = firebase.firestore();
  let fetchEvents = () => {
    let ref = db.collection(eventKey(localStorage.getItem('user')));
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
      if(tab === 'color') _tab = 'create';
      if(event.length) setEvent(event.slice(0, event.length - 1));
      setTab(_tab);
    }
  }, [event]);
  useEffect(() => {
    let localUser = localStorage.getItem('user');
    if(localUser) {
      db.doc('foo_users/' + localUser).get().then(doc => {
        if(doc.exists) fetchEvents();
      });
    } else {
      setBusy(false);
    }
  }, []);
  let openEvent = (e) => {
    setEvent(event.concat(e));
    setTab('calendar');
  }
  let editEvent = event => {
    setEvent(event);
    setTab('create');
  }
  let createEvent = () => {
    setEvent([]);
    window._event = null;
    setTab('create');
  }
  let saveTemp = name => {
    window.name = name;
    setTab('color');
  }
  let saveEvent = color => {
    let db = firebase.firestore();
    let eventNew = {
      color, name: window.name,
    }
    if(event.length) {
      db.collection('foo_users/' + localUser + '/items').doc(event[0].id).set(eventNew);
      setEvents(events.map(e => {
        if(e.id === event[0].id) return Object.assign({
          id: event[0].id,
        }, eventNew);
        return e;
      }));
    } else {
      db.collection('foo_users/' + localUser + '/items').add(eventNew).then(ref => {
        setEvents(events.concat(Object.assign({
          id: ref.id,
        }, eventNew)));
      });
    }
    setTab('register');
  }
  let deleteItem = id => {
    let localUser = localStorage.getItem('user');
    db.collection('foo_users/' + localUser + '/items').doc(id).delete();
    setTab('register');
    setEvents(events.filter(e => e.id !== id));
  }
  useEffect(() => {
    let tabs = [
      'create',
      'calendar',
      'compare',
    ];
    if(tabs.includes(tab)) window.history.pushState({}, '', '');
  }, [tab]);
  let openCompareMode = () => setTab('compare');
  let showApp = () => {
    if(['register', 'compare'].includes(tab)) return <Register
      busy={busy}
      setEvent={openEvent}
      events={events}
      editEvent={editEvent}
      createEvent={createEvent}
      event={event} />
    if(tab === 'calendar') return <Calendar event={event} setEvent={setEvent} events={events} compareMode={openCompareMode} />
    if(tab === 'create') return <Create saveTemp={saveTemp} setTab={setTab} event={event} />
    if(tab === 'color') return <ColorPicker setColor={saveEvent} />
    if(tab === 'delete') return <DeleteModal event={event} setTab={setTab} removeItem={deleteItem} />
    return null;
  }
  return (
    <div className="App">
      <div className="App-view">
        {user ? showApp() : <Login setUser={setUser} />}
      </div>
    </div>
  );
}

export default App;
