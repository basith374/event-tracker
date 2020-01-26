import React from 'react';

export const colors = [
    '#003f5c',
    '#50945f',
    '#2867d4',
    '#603bad',
    '#a92c97',
    '#da3b7d',
    '#c53b46',
    '#ff7c43',
    '#ffa600',
]

export default function ColorPicker(props) {
    return <div className="App-colors">
        {colors.map(f => <div style={{background: f}} onClick={e => props.setColor(f)} key={f}></div>)}
    </div>
}