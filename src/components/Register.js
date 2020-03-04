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
    let events = props.events;
    if(props.event.length) {
        let ids = props.event.map(e => e.id);
        events = events.filter(e => !ids.includes(e.id));
    }
    return (
        <div className="reg">
            {props.busy && <Loading />}
            {props.events.length > 0 && <div className="reg-b">
                {events.map((e, i) => <div
                    className="reg-i"
                    id={e.id}
                    style={{background: e.color}}
                    key={i}
                    onClick={() => register(e)}
                    >{e.name}</div>)}
            </div>}
        </div>
    )
}