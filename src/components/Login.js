import React from 'react';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

export default function Login(props) {
    let login = () => {
      let username = document.getElementById('name').value;
      if(username) {
        let db = firebase.firestore();
        db.collection('foo_users').add({
          join: new Date(),
          username,
        })
        .then((ref) => {
          props.setUser(ref.id);
          localStorage.setItem('user', ref.id);
        });
      }
    }
    let keyDown = e => {
      if(e.keyCode === 13) {
        login();
      }
    }
    return <div className="App-center App-login">
        <div>
            <div className="App-sect wlcm">
                <img src={require('../hospitality.png')} alt="welcome" />
                <h2>Welcome</h2>
            </div>
            <div>
                <input type="text" id="name" onKeyDown={keyDown} placeholder="Enter username" />
            </div>
        </div>
    </div>
}