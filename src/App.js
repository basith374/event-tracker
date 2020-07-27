import React, { useState, useEffect, useCallback } from 'react';
import {
  Switch,
  Route,
  useHistory,
  useLocation,
} from "react-router-dom";
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
  const history = useHistory();
  const location = useLocation();
  let [event, setEvent] = useState([]); // working list
  let localUser = localStorage.getItem('user');
  let [events, setEvents] = useState([]); // display list
  let [user, setUser] = useState(localUser || '');
  let [busy, setBusy] = useState(true);
  let db = firebase.firestore();
  let fetchEvents = useCallback(() => {
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
  }, [db])
  useEffect(() => {
    window.onpopstate = () => {
      // check should pop event
      const rEvent = event.length > 0 && location.pathname !== '/compare';
      if(rEvent) setEvent(event.slice(0, event.length - 1));
    }
  }, [event, location]);
  useEffect(() => {
    let localUser = localStorage.getItem('user');
    if(localUser) {
      db.doc('foo_users/' + localUser).get().then(doc => {
        if(doc.exists) fetchEvents();
      });
    } else {
      setBusy(false);
    }
  }, [db, fetchEvents]);
  let openEvent = (e) => {
    setEvent(event.concat(e));
    history.push('calendar')
  }
  let editEvent = event => {
    setEvent([event]);
    history.push('create')
  }
  let createEvent = () => {
    setEvent([]);
    window._event = null;
    history.push('create')
  }
  let saveTemp = name => {
    window.name = name;
    history.push('color')
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
    history.replace('/')
  }
  let deleteItem = id => {
    let localUser = localStorage.getItem('user');
    db.collection('foo_users/' + localUser + '/items').doc(id).delete();
    history.replace('/')
    setEvents(events.filter(e => e.id !== id));
  }
  const logout = () => {
    localStorage.removeItem('user');
    setUser(false);
  }
  let showApp = () => {
    return <Switch>
    <Route path="/calendar">
      <Calendar event={event} setEvent={setEvent} events={events} />
    </Route>
    <Route path="/create">
      <Create saveTemp={saveTemp} event={event} />
    </Route>
    <Route path="/color">
      <ColorPicker setColor={saveEvent} />
    </Route>
    <Route path="/delete">
      <DeleteModal event={event[0]} removeItem={deleteItem} />
    </Route>
    <Route path="/compare">
      <Register
        busy={busy}
        setEvent={openEvent}
        events={events}
        editEvent={editEvent}
        createEvent={createEvent}
        event={event}
        logout={logout} />
    </Route>
    <Route path="/">
      <Register
        busy={busy}
        setEvent={openEvent}
        events={events}
        editEvent={editEvent}
        createEvent={createEvent}
        event={event}
        logout={logout} />
    </Route>
    </Switch>
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
