import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom'
import 'firebase/firestore';
import './register.css';

function Loading() {
    return <div className="ld"><div></div></div>
}

export default function Register(props) {
    const location = useLocation();
    let clicktimer = useRef();
    let register = (event) => {
        props.setEvent(event);
    }
    let onMouseUp = (e) => {
        e.preventDefault()
        clearTimeout(clicktimer.current);
        if(window._event) register(window._event);
    }
    let onMouseDown = e => {
        window._event = e;
        clicktimer.current = setTimeout(() => {
            props.editEvent(e);
            clicktimer.current = null;
        }, 1000);
    }
    let events = props.events;
    if(props.event.length) {
        let ids = props.event.map(e => e.id);
        events = events.filter(e => !ids.includes(e.id));
    }
    return (
        <div className="reg">
            <div className="reg-h">
                <button onClick={props.logout} className="lgt">
                    <img src={require('../turn-off.svg')} alt="plus" />
                </button>
                {location.pathname === '/' && 
                <button onClick={props.createEvent} className="pls">
                    <img src={require('../plus.png')} alt="plus" />
                </button>}
            </div>
            {!props.busy && props.events.length === 0 && <div className="reg-e">
                <div className="txt">
                    Add new
                </div>
                <div className="image">
                    <img src={require('../swirly-scribbled-arrow.png')} alt="arrow" />
                </div>
            </div>}
            {props.busy && <Loading />}
            {props.events.length > 0 && <div className="reg-b">
                {events.map((e, i) => <div
                    className="reg-i"
                    id={e.id}
                    style={{background: e.color}}
                    key={i}
                    onTouchStart={() => onMouseDown(e)}
                    onTouchMove={() => window._event = null}
                    onTouchEnd={onMouseUp}
                    >{e.name}</div>)}
            </div>}
        </div>
    )
}