import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './calendar.css';
import moment from 'moment';
import _ from 'lodash';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { dataKey } from '../config';

function createEl(p, cls) {
    let el = document.createElement('div');
    el.className = cls;
    return p.appendChild(el);
}

function createText(p, text, cls) {
    let c = createEl(p, cls);
    c.innerText = text;
    return c;
}

function createTile(con, date) {
    let d = moment(date, 'DD-MM-YYYY');
    createText(con, d.date(), 'c-d');
    createEl(con, 'pn-c');
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
        if(event.length > 1) event.forEach(f => {
            let point = document.createElement('div');
            point.className = 'pnkt';
            let color = createEl(point);
            color.style.background = f.color;
            tile.querySelector('.pn-c').appendChild(point);
        });
        else style.background = event[0].color;
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
        .where('event', 'in', event.map(e => e.id))
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
        .where('event', 'in', event.map(e => e.id))
        .get()
        .then(snap => {
            let colorMap = _.mapValues(_.keyBy(event, 'id'), e => e.color);
            let eventGrps = {};
            snap.forEach(f => {
                let data = f.data();
                let date = moment(data.time).format('DD-MM-YYYY');
                if(!(date in eventGrps)) eventGrps[date] = [];
                eventGrps[date].push(Object.assign({color: colorMap[data.event]}, data));
            });
            Object.keys(eventGrps).forEach(bucket => {
                // day is a bucket
                let date = moment(bucket, 'DD-MM-YYYY')
                let weekstart = date.clone().startOf('week').format('DD-MM-YYYY');
                let row = document.getElementById('week-' + weekstart);
                if(row) {
                    let tile = row.children[date.day()];
                    if(tile) styleTile(tile, date, eventGrps[bucket]);
                    row.setAttribute('has-events', true);
                }
            });
        });
}

export default function Calendar(props) {
    const history = useHistory();
    let scrollDbnce = useRef();
    let [compare, setCompare] = useState(true);
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
        const scrollListener = e => {
            if(scrollDbnce.current) clearTimeout(scrollDbnce.current);
            scrollDbnce.current = setTimeout(() => {
                setCompare(true);
            }, 100);
            setCompare(false);
            let parent = document.querySelector('.cal');
            if(parent)
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
        };
        document.querySelector('.cal-c').addEventListener('scroll', scrollListener);
        // scroll top mid
        document.querySelector('.cal-c').scrollTop = bufferHeight;
        // toggle listeners, punch, register
        const clickListener = e => {
            let el = e.target;
            if(el && props.event.length === 1) {
                if(!/\d{2}-\d{2}-\d{4}/.test(el.id)) el = el.parentNode;
                if(!el.classList.contains('cal-dat')) return;
                let date = moment(el.id, 'DD-MM-YYYY');
                let start = date.startOf('day').valueOf();
                let end = date.endOf('day').valueOf();
                let hasEvents = el.hasAttribute('has-events');
                styleTile(el, el.id, hasEvents ? null : props.event);
                el.classList.add('block');
                if(props.event.length)
                db.collection(dataKey)
                    .where('time', '>=', start)
                    .where('time', '<=', end)
                    .where('event', '==', props.event[0].id)
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
                                event: props.event[0].id,
                            });
                            styleTile(el, el.id, props.event);
                        }
                    }).catch(rsp => {
                        el.classList.remove('block');
                        styleTile(el, el.id, hasEvents ? props.event : null); // undo
                    });
            }
        }
        document.querySelector('.cal').addEventListener('click', clickListener);
        return () => {
            document.querySelector('.cal-c').removeEventListener('scroll', scrollListener);
            document.querySelector('.cal').removeEventListener('click', clickListener);
        }
    }, [props.event]);
    const canShowCompare = props.events.length > 1 && props.event.length < 3
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
                <div className="cal">
                </div>
            </div>
            {canShowCompare && <div className={'c-flt' + (compare ? ' show' : '')}>
                <button onClick={() => history.push('/compare')}>Compare</button>
            </div>}
        </div>
    )
}