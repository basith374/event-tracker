import React from 'react';

export default function DeleteModal(props) {
    let onDelete = () => {
        let confirmation = document.getElementById('name').value;
        if(confirmation === props.event.name) {
            props.removeItem(props.event.id);
        }
    }
    return <div className="App-center">
        <form autoComplete="off">
            <div className="App-sect">
                <div className="lbl">Confirm Delete</div>
            </div>
            <div className="App-sect ex">
                <input type="text" placeholder="Enter name" id="name" />
            </div>
            <div className="App-sect">
                <button className="danger" onClick={onDelete}>Delete</button>
            </div>
        </form>
    </div>
}