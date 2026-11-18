import SAMPLE_DATA from '../sample-data.json' with { type: 'json' };
import { ActivityType } from './types.js';
const DATA_SAMPLE = SAMPLE_DATA
    .filter(d => ActivityType[d.a] === ActivityType.Run), TYPE_MAP = {
    [ActivityType.Run]: [
        'Run',
        'TrailRun',
        'VirtualRun'
    ],
    [ActivityType.Swim]: ['Swim'],
    [ActivityType.Ride]: [
        'GravelRide',
        'Handcycle',
        'MountainBikeRide',
        'Ride',
        'VirtualRide',
        'Velomobile',
        'Wheelchair'
    ],
    [ActivityType.Walk]: [
        'Hike',
        'Snowshoe',
        'Walk'
    ]
}, TYPE_NOT_OTHER = Object
    .values(TYPE_MAP)
    .flat();
let dataAll = DATA_SAMPLE, dataFiltered = DATA_SAMPLE, hasNewData = true;
export function setData(data) {
    dataAll = data;
    hasNewData = true;
}
export function loadData() {
    return dataFiltered;
}
export function filterData(dateFrom, dateTo, type = ActivityType.All) {
    dataFiltered = dataAll.filter(d => {
        var _a;
        const DATE = new Date(d.d).valueOf();
        return (type === ActivityType.All ||
            (type === ActivityType.Other && !TYPE_NOT_OTHER.includes(d.a)) ||
            ((_a = TYPE_MAP[type]) === null || _a === void 0 ? void 0 : _a.includes(d.a))) && (DATE >= dateFrom &&
            DATE <= dateTo);
    });
    hasNewData = true;
}
export function checkNewData() {
    if (hasNewData) {
        hasNewData = false;
        return true;
    }
    return false;
}
