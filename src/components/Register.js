import React from 'react';
import 'firebase/firestore';
import './register.css';

function Loading() {
    return <div className="ld"><div></div></div>
}

export default function Register(props) {
    let register = (event) => {
        props.setEvent(event);
    }
    return (
        <div className="reg">
            {props.busy && <Loading />}
            {props.events.length > 0 && <div className="reg-b">
                {props.events.map((e, i) => <div
                    className="reg-i"
                    id={e.id}
                    style={{background: e.color}}
                    key={i}
                    onClick={e => register(e)}
                    >{e.name}</div>)}
            </div>}
        </div>
    )
}