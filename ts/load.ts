import { setData } from "./data.js";
import { Datum, StravaActivity } from "./types.js";

const
    CLIENT_ID = '64979',
    STORAGE_KEY_TOKEN = 'stravaAccessToken',
    PAGE_IDS = [
        '149158155151160166145165151149164151166111103106107104',
        '104151100103099103152106106103101100107152098149100147',
        '099105107148105102099149105147105105098152151100098150'
    ],
    PROJECT_URL = 'https://niallains.github.io/chart-your-strava',
    PER_PAGE = 50,
    MAX_ACTS = 500,
    MIN_DATE = new Date().valueOf() - (1000 * 60 * 60 * 24 * 365 * 10),
    EL_BUTTON = document.createElement('button'),
    EL_STATUS = document.createElement('div');

export function init(parentEl: HTMLElement, isAuthRedirect: boolean = false) {
    EL_BUTTON.classList.add('load__button');
    EL_STATUS.classList.add('load__status');
    EL_BUTTON.innerText = 'Load activities';
    EL_BUTTON.onclick = () => attemptLoadData();
    parentEl.appendChild(EL_BUTTON);
    parentEl.appendChild(EL_STATUS);
    
    if (isAuthRedirect) {
        attemptLoadData();
    }
}

async function attemptLoadData(attemptAfterFetch: boolean = false) {
    const TOKEN = sessionStorage.getItem(STORAGE_KEY_TOKEN);

    if (TOKEN && TOKEN !== 'undefined') {
        loadData(TOKEN);
    } else if (!attemptAfterFetch) {
        await getAccessToken();
        attemptLoadData(true);
    } else {
        setTimeout(
            () => setStatus("Your data can't be loaded due to a permissions issue with your Strava account"),
            1000
        );
    }
}

// Get Strava auth access token
async function getAccessToken() {
    const AUTH_CODE = (window.location.href.match(/code=([^&]*)(&|$)/) || ['', ''])[1];

    if (AUTH_CODE) {
        await fetch(
            `https://www.strava.com/oauth/token?client_id=${
                CLIENT_ID
            }&${
                PAGE_IDS.join('').match(/.{3}/g)!.map(i => toPage(i)).join('')
            }&code=${
                AUTH_CODE
            }&grant_type=authorization_code`,
            { method: 'POST' }
        )
        .then(resp => resp.json())
        .then(data => sessionStorage.setItem(STORAGE_KEY_TOKEN, data.access_token));
    } else {
        window.location.href =
            'https://www.strava.com/oauth/authorize?' +
            'client_id=' + CLIENT_ID +
            '&response_type=code&redirect_uri=' + PROJECT_URL +
            '&approval_prompt=force&scope=activity:read_all';
    }
}

async function loadData(accessToken: string) {    
    let
        acts: Datum[] = [],
        page = 1,
        dataError = false,
        inactiveError = false;

    setTimeout(
        () => {
            if (acts.length == 0 && !dataError) {
                setStatus(`0 activites loaded...`)
            }
        },
        500
    );
    
    while (page <= MAX_ACTS / PER_PAGE) {
        await fetch(
            'https://www.strava.com/api/v3/athlete/activities?' +
                '&per_page=' + PER_PAGE +
                '&page=' + page +
                '&access_token=' + accessToken,
            {
                method: 'GET'
            }
        )
        .then(resp => resp.json())
        .then(data => {
            try {
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
                        p:  transcodePath(act.map?.summary_polyline),
                        e:  [act.elev_low, act.elev_high, act.total_elevation_gain]
                    }))
                ];
                if (new Date(data[data.length - 1].start_date_local).valueOf() < MIN_DATE) {
                    page = MAX_ACTS;
                }
            } catch (err) {
                console.warn('Sucessful requests:', acts)
                console.error('Error:', err);
                console.error('Failed requests:', data);
                dataError = true;
                inactiveError = data.errors[0].code === 'Inactive';
                page = MAX_ACTS;
            }
        });
        
        setStatus((page * PER_PAGE) + ' activites loaded...');
        page += 1;
    }
    
    setStatus(
        inactiveError
            ? `Your data can't be loaded due to <a class="load__link" href="https://techcrunch.com/2026/06/01/strava-declares-war-on-scrapers-ahead-of-ipo/> the ongoing death of the open internet </a>"`
            : dataError
            ? "Your data can't be loaded due to an issue with the Strava API"
            : acts.length + ' activites loaded successfully'
    );
    setData(acts);
}

function transcodePath(encoded?: string): string {
    if (!encoded) {
        return '';
    }

    try {
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
    } catch (err) {
        console.error('Path encoding error:', encoded, err);
        return '';
    }
}

function toPage(p: string): string {
    return String.fromCharCode(parseInt(p) - PER_PAGE);
}

function setStatus(status: string) {
    EL_STATUS.innerHTML = status;
}