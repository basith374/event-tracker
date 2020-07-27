import React, { useState } from 'react';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import GoogleLogin from 'react-google-login';
import _ from 'lodash';

function Loading() {
  return <div className="ld dk"><div></div></div>
}

export default function Login(props) {
  const [busy, setBusy] = useState(false);
    let login = (username) => {
      let db = firebase.firestore();
      db.collection('foo_users')
        .where('username', '==', username)
        .get()
        .then(snap => {
          if(snap.size) {
            const id = snap.docs[0].id;
            props.setUser(id);
            localStorage.setItem('user', id);
          } else {
            db.collection('foo_users').add({
              join: new Date(),
              username,
            }).then(snap => {
              props.setUser(snap.id);
              localStorage.setItem('user', snap.id);
            })
          }
        });
    }
    const responseGoogle = (response) => {
      const email = _.get(response, 'profileObj.email');
      if(email) login(email)
      else {
        setBusy(false)
        console.log(response)
      }
    }
    const render = () => {
      if(busy) return <Loading />
      return <div>
            <div className="App-sect wlcm">
                <img src={require('../hospitality.png')} alt="welcome" />
                <h2>Welcome</h2>
            </div>
            <div>
              <GoogleLogin
                clientId="470331494523-puqdl0ljl3adqt7eab1n12e7a64hf7hb.apps.googleusercontent.com"
                buttonText="Login with Google"
                onRequest={() => setBusy(true)}
                onSuccess={responseGoogle}
                onFailure={responseGoogle}
                // isSignedIn={true}
              />
            </div>
        </div>
    }
    return <div className="App-center App-login">
      {render()}
    </div>
}