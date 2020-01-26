import React, { useState } from 'react';
import _ from 'lodash';

export default function Create(props) {
    let forward = () => {
        let name = document.getElementById('name').value;
        if(name) {
            props.saveTemp(name);
        }
    }
    let onKeyDown = e => {
        if(e.keyCode === 13) forward();
    }
    let defaultValue = _.get(window, '_event.name');
    return <div className="App-center">
        <form autoComplete="off">
            <div className="App-sect">
                <div className="lbl">{window._event ? 'Edit' : 'Add new'}</div>
            </div>
            <div className="App-sect">
                <input type="text" placeholder="Enter name" onKeyDown={onKeyDown} defaultValue={defaultValue} id="name" /> 
            </div>
            <div className="App-sect ex">
                <button type="button" className="green" style={{background: _.get(window, '_event.color')}} onClick={forward}>Color</button>
            </div>
            {props.event && [
                <div className="App-sect" key={0}>
                    <div className="lbl">Danger zone</div>
                </div>,
                <div key={1}>
                    <button type="button" className="danger" onClick={() => props.setTab('delete')}>Delete</button>
                </div>
            ]}
        </form>
    </div>
}