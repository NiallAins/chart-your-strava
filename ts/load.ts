import { setData } from "./data.js";
import { Datum, StravaActivity } from "./types.js";

const
    CLIENT_ID = '64979',
    PAGE_IDS = [
        '11912812512113013611513512111913412113608107307607707',
        '40741210700730690731220760760730710700771220681190701',
        '17069075077118075072069119075117075075068122121070068120'
    ],
    PROJECT_URL = 'https://nialldesign.dev/chart-your-strava',
    PER_PAGE = 50,
    MAX_ACTS = 500,
    MIN_DATE = new Date().valueOf() - (1000 * 60 * 60 * 24 * 365 * 10),
    EL_BUTTON = document.createElement('button'),
    EL_STATUS = document.createElement('div');

export function init(parentEl: HTMLElement) {
    EL_BUTTON.classList.add('load__button');
    EL_BUTTON.innerText = 'Load activities';
    EL_BUTTON.onclick = () => attemptLoadData();
    parentEl.appendChild(EL_BUTTON);
    parentEl.appendChild(EL_STATUS);
}

async function attemptLoadData() {
    const TOKEN = sessionStorage.getItem('stravaAccessToken');

    if (TOKEN && TOKEN !== 'undefined') {
        loadData(TOKEN);
    } else {
        await setAccessToken();
        // attemptLoadData();
    }
}

// Get Strava auth access token
async function setAccessToken() {
    const AUTH_CODE = 'a8525f372a562a291d940fd9dd5066335be99902'; //(window.location.href.match(/code=([^&]*)(&|$)/) || ['', ''])[1];

    console.log(PAGE_IDS.join('').match(/.{3}/g)!.map(i => toPage(i)).join(''));
    if (AUTH_CODE) {
        await fetch(
            `https://www.strava.com/oauth/token?client_id=${
                CLIENT_ID
            }&${
                // 'client_secret=58966e2515f885329f0c2a179b741c7a770fe20d'
                PAGE_IDS.join('').match(/.{3}/g)!.map(i => toPage(i)).join('')
            }&code=${
                AUTH_CODE
            }&grant_type=authorization_code`,
            { method: 'POST' }
        )
        .then(resp => resp.json())
        .then(data => sessionStorage.setItem('stravaAccessToken', data.access_token));
    } else {
        window.location.href =
            'https://www.strava.com/oauth/authorize?' +
            'client_id=' + CLIENT_ID +
            '&response_type=code&redirect_uri=' + PROJECT_URL +
            '&approval_prompt=force&scope=activity:read_all';
    }
}

async function loadData(accessToken: string) {
    EL_STATUS.innerText = '0 activites loaded...';
    
    let
        acts: Datum[] = [],
        page = 1;   
    
    while (page <= MAX_ACTS / PER_PAGE) {
        await fetch(
            'https://www.strava.com/api/v3/athlete', // /activities?' +
            // '&per_page=' + PER_PAGE + '&page=' + page,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${ accessToken }`
                }
            }
        )
        .then(resp => resp.json())
        .then(data => {
                acts = [
                    ...acts,
                    ...data.map((act: StravaActivity) => ({
                        a:  act.type,
                        n:  act.name,
                        d:  act.start_date_local,
                        l:  act.distance,
                        t:  act.moving_time,
                        c:  act.average_cadence,
                        s:  act.average_speed,
                        sm: act.max_speed,
                        h:  act.average_heartrate,
                        hm: act.max_heartrate,
                        p:  transcodePath(act.map.summary_polyline),
                        e:  [act.elev_low, act.elev_high, act.total_elevation_gain]
                    }))
                ];
            if (new Date(data[data.length - 1].start_date_local).valueOf() < MIN_DATE) {
                page = MAX_ACTS;
            }
        });
        
        EL_STATUS.innerText = (page * PER_PAGE) + ' activites loaded...';
        page += 1;
    }
    
    EL_STATUS.innerText = (page * PER_PAGE) + ' activites loaded successfully';
    setData(acts);
}

function transcodePath(encoded: string): string {
    var
        points: [number, number][] = [],
        index = 0,
        len = encoded.length,
        lat = 0,
        lng = 0;
    while (index < len) {
        var b, shift = 0, result = 0;
        do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        points.push([lat, lng]);
    }
    return points
        .map((p, i) => {
            if (i === 0) {
                return p[0] + ',' + p[1];
            }
            return (p[0] - points[i - 1][0]) + ',' + (p[1] - points[i - 1][1]);
        })
        .join(';');
}

function toPage(p: string): string {
    return String.fromCharCode(parseInt(p) + PER_PAGE);
}