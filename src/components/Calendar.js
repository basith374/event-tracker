import React, { useEffect } from 'react';
import './calendar.css';
import moment from 'moment';
import _ from 'lodash';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { dataKey } from '../config';

function createText(p, text, cls) {
    let c = document.createElement('div');
    c.innerText = text;
    c.className = cls;
    return p.appendChild(c);
}

function createTile(con, date) {
    let d = moment(date, 'DD-MM-YYYY');
    createText(con, d.date(), 'c-d');
    styleTile(con, date);
}

function styleTile(tile, date, event) {
    let style = {}
    let target = tile.children[0];
    let d = moment(date, 'DD-MM-YYYY');
    // future
    if(d.valueOf() > new Date().valueOf()) {
        tile.classList.add('idl');
    } else {
        tile.classList.remove('idl');
    }
    // today
    if(moment().format('DD-MM-YYYY') === date) {
        tile.classList.add('lit');
    } else {
        tile.classList.remove('lit');
    }
    if(event) {
        style.background = event.color;
        tile.setAttribute('has-events', true);
        tile.classList.remove('lit');
    } else {
        style.background = null;
        tile.removeAttribute('has-events');
    }
    if(target) Object.keys(style).forEach(s => target.style[s] = style[s]);
}

function fillWeek(row, date, odd, month) {
    row.innerHTML = '';
    if(odd) row.classList.add('odd');
    else row.classList.remove('odd');
    let months = [];
    for(let i = 0; i < 7; i++) {
        let day = document.createElement('div');
        let cls = ["cal-dat"];
        let _date = moment(date, 'DD-MM-YYYY').add(i, 'day');
        if(_date.month() !== month) cls.push('odd');
        day.className = cls.join(' ');
        let d = _date.format('DD-MM-YYYY');
        months.push(_date.month());
        createTile(day, d);
        day.id = d;
        row.appendChild(day);
    }
    row.id = 'week-' + date;
    row.setAttribute('date', date);
    return _.uniq(months).length > 1;
}

function fetchWeek(event, row) {
    let first = moment(row.getAttribute('date'), 'DD-MM-YYYY').valueOf();
    let last = moment(row.getAttribute('date'), 'DD-MM-YYYY').endOf('week').valueOf();
    window.db.collection(dataKey)
        .where('time', '>=', first)
        .where('time', '<=', last)
        .where('event', '==', event.id)
        .get()
        .then(snap => {
            snap.forEach(f => {
                let data = f.data();
                let date = moment(data.time).startOf('week').format('DD-MM-YYYY');
                let tile = row.children[moment(data.time).day()];
                if(tile) styleTile(tile, date, event);
            });
            row.setAttribute('has-events', snap.length > 0);
        });
}

window.expander = (db) => {
    db.get().then(snap => {
        snap.forEach(f => {
            console.log(f.data());
        })
    })
}

const fillUp = (offset, maxBoxes, boxHeight, event) => {
    let odd = true;
    let start = moment().startOf('week').subtract(offset, 'weeks');
    let month = start.month();
    let rows = [...Array(maxBoxes).keys()].map(f => {
        let row = document.createElement('div');
        row.className = 'cal-i';
        row.style.height = boxHeight + 'px';
        if(start.month() !== month) {
            odd = !odd;
            month = start.month();
        }
        fillWeek(row, start.format('DD-MM-YYYY'), odd, month);
        start.add(1, 'week');
        document.querySelector('.cal').appendChild(row);
        return row;
    })
    let first = moment(rows[0].getAttribute('date'), 'DD-MM-YYYY').valueOf();
    let last = moment(rows[rows.length - 1].getAttribute('date'), 'DD-MM-YYYY').endOf('day').valueOf();
    window.db.collection(dataKey)
        .where('time', '>=', first)
        .where('time', '<=', last)
        .where('event', '==', event.id)
        .get()
        .then(snap => {
            snap.forEach(f => {
                let data = f.data();
                let date = moment(data.time).startOf('week').format('DD-MM-YYYY');
                let row = document.getElementById('week-' + date);
                if(row) {
                    let tile = row.children[moment(data.time).day()];
                    if(tile) styleTile(tile, date, event);
                    row.setAttribute('has-events', true);
                }
            });
        });
}

export default function Calendar(props) {
    useEffect(() => {
        let db = firebase.firestore();
        window.db = db;
        let boxHeight = 60;
        // calculations, dimensions, resize
        let height = document.querySelector('.cal').offsetHeight;
        let bufferBoxes = 10;
        let visibleBoxes = Math.ceil(height / boxHeight);
        let maxBoxes = visibleBoxes + bufferBoxes * 2;
        let newHeight = boxHeight * maxBoxes;
        let bufferHeight = boxHeight * bufferBoxes;
        document.querySelector('.cal').style.height = newHeight + 'px';
        // fill up tiles
        fillUp(bufferBoxes + parseInt(visibleBoxes / 2, 10), maxBoxes, boxHeight, props.event);
        // attach scroll listeners
        document.querySelector('.cal-c').addEventListener('scroll', e => {
            let parent = document.querySelector('.cal');
            if(e.target.scrollTop >= bufferHeight + boxHeight) { // scroll down
                let el = parent.firstChild;
                parent.removeChild(el);
                let time = moment(parent.lastChild.getAttribute('date'), 'DD-MM-YYYY');
                let prevMonth = time.month();
                time.add('1', 'week');
                let curOdd = parent.lastChild.classList.contains('odd');
                let month = time.month();
                let odd = month !== prevMonth ? !curOdd : curOdd;
                fillWeek(el, time.format('DD-MM-YYYY'), odd, month);
                fetchWeek(props.event, el);
                parent.appendChild(el);
            } else if(e.target.scrollTop < bufferHeight) { // scroll up
                let el = parent.lastChild;
                parent.removeChild(el);
                let time = moment(parent.firstChild.getAttribute('date'), 'DD-MM-YYYY');
                let prevMonth = time.month();
                time.subtract('1', 'week');
                let curOdd = parent.firstChild.classList.contains('odd');
                let month = time.month();
                let odd = month !== prevMonth ? !curOdd : curOdd;
                fillWeek(el, time.format('DD-MM-YYYY'), odd, month);
                fetchWeek(props.event, el);
                parent.insertBefore(el, parent.firstChild);
            }
        });
        // scroll top mid
        document.querySelector('.cal-c').scrollTop = bufferHeight;
        // toggle listeners, punch, register
        document.querySelector('.cal').addEventListener('click', e => {
            let el = e.target;
            if(el) {
                if(!/\d{2}-\d{2}-\d{4}/.test(el.id)) el = el.parentNode;
                if(!el.classList.contains('cal-dat')) return;
                let date = moment(el.id, 'DD-MM-YYYY');
                let start = date.startOf('day').valueOf();
                let end = date.endOf('day').valueOf();
                let hasEvents = el.hasAttribute('has-events');
                styleTile(el, el.id, hasEvents ? null : props.event);
                el.classList.add('block');
                if(props.event)
                db.collection(dataKey)
                    .where('time', '>=', start)
                    .where('time', '<=', end)
                    .where('event', '==', props.event.id)
                    .get()
                    .then(snap => {
                        el.classList.remove('block');
                        let events = [];
                        snap.forEach(row => {
                            events.push(row.id);
                        });
                        if(events.length) {
                            events.forEach(id => {
                                db.collection(dataKey).doc(id).delete();
                            });
                            styleTile(el, el.id);
                        } else {
                            db.collection(dataKey).add({
                                time: date.valueOf(),
                                event: props.event.id,
                            });
                            styleTile(el, el.id, props.event);
                        }
                    }).catch(rsp => {
                        el.classList.remove('block');
                        styleTile(el, el.id, hasEvents ? props.event : null); // undo
                    });
            }
        });
    }, []);
    return (
        <div className="cal-p">
            <div className="cal-h">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
            </div>
            <div className="cal-c">
                <div className="cal"></div>
            </div>
        </div>
    )
}