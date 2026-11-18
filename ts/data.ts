import SAMPLE_DATA from '../sample-data.json' with { type: 'json' };
import { ActivityType, Datum } from './types.js';

const
    DATA_SAMPLE = (SAMPLE_DATA as Datum[])
        .filter(d => ActivityType[d.a as keyof typeof ActivityType] === ActivityType.Run),
    TYPE_MAP: { [key in ActivityType]?: string[] } = {
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
    },
    TYPE_NOT_OTHER = Object
        .values(TYPE_MAP)
        .flat();

let
    dataAll = DATA_SAMPLE,
    dataFiltered = DATA_SAMPLE,
    hasNewData = true;

export function setData(data: Datum[]) {
    dataAll = data;
    hasNewData = true;
}

export function loadData(): Datum[] {
    return dataFiltered;
}

export function filterData(
    dateFrom: number,
    dateTo: number,
    type: ActivityType = ActivityType.All
) {
    dataFiltered = dataAll.filter(d => {
        const DATE = new Date(d.d).valueOf();
        return (
            type === ActivityType.All || 
            (type === ActivityType.Other && !TYPE_NOT_OTHER.includes(d.a)) ||
            TYPE_MAP[type]?.includes(d.a)
        ) && (
            DATE >= dateFrom &&
            DATE <= dateTo
        );
    });
    hasNewData = true;
}

export function checkNewData(): boolean {
    if (hasNewData) {
        hasNewData = false;
        return true;
    }
    return false;
}