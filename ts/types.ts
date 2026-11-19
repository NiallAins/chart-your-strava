export type Datum = {
    a:  string,                   // Activity type (Run, Swim, Ride, Hike...)
    n:  string,                   // Activity name
    d:  string,                   // Date-time
    l:  number,                   // Length (metres)
    t:  number,                   // Time (seconds)
    c:  number,                   // Average cadance (steps per minute)
    s:  number,                   // Average speed (metres per second)
    sm: number,                   // Max speed (metres per second)
    h:  number,                   // Average heart rate (beats per minute)
    hm: number,                   // Max heart rate (beats per minute)
    e:  [number, number, number], // Elevation data as [min, max, gained] (metres)
    p:  string                    // GPS path as "lat, lng; delta lat, delta lng; delta lat..." (0.0001 degrees)
};

export type StravaActivity = {
    type: string,
    name: string,
    start_date_local: string,
    distance: number,
    moving_time: number,
    average_cadence: number,
    average_speed: number,
    max_speed: number,
    average_heartrate: number,
    max_heartrate: number,
    map: {
        summary_polyline: string
    },
    elev_low: number,
    elev_high: number,
    total_elevation_gain: number
};

export type Bar = {
    x: number,
    y: number,
    n: string,
    c: string
};

export enum Tab {
    Routes,
    Charts,
    Map,
    Load
}

export enum ActivityType {
    'Run',
    'Swim',
    'Ride',
    'Walk',
    'Other',
    'All'
}











