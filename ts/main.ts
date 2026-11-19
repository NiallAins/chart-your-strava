import { render as renderRoutes } from "./routes.js";
import { render as renderCharts } from "./charts.js";
import { render as renderMap, animate as animateMap } from "./map.js";
import { checkNewData } from "./data.js";
import { init as initLoader } from "./load.js";
import { Tab } from "./types.js";

const
    EL_TAB_BUTTONS = {
        [Tab.Routes]: document.getElementById('tabButton_routes'),
        [Tab.Charts]: document.getElementById('tabButton_charts'),
        [Tab.Map]: document.getElementById('tabButton_map'),
        [Tab.Load]: document.getElementById('tabButton_load')
    } as { [key in Tab]: HTMLButtonElement },
    EL_TAB_BODIES = {
        [Tab.Routes]: document.getElementById('tabBody_routes'),
        [Tab.Charts]: document.getElementById('tabBody_charts'),
        [Tab.Map]: document.getElementById('tabBody_map'),
        [Tab.Load]: document.getElementById('tabBody_load')
    } as { [key in Tab]: HTMLElement },
    TAB_COUNT = Object
        .values(EL_TAB_BUTTONS)
        .length;

let resizeDebounce = -1;

function init() {
    const AUTH_REDIRECT = !!window.location.href.match('code=');
    window.onresize = () => render();
    initTabs();
    setTab(AUTH_REDIRECT ? Tab.Load : Tab.Charts);
    initLoader(EL_TAB_BODIES[Tab.Load], AUTH_REDIRECT);
}

function initTabs() {
    Object
        .values(EL_TAB_BUTTONS)
        .forEach((b, bi) => {
            b.onclick = () => setTab(bi);
            b.onkeydown = e => {
                const active = Object
                    .values(EL_TAB_BUTTONS)
                    .findIndex(b => b.getAttribute('aria-selected') === 'true');
                if (e.code === 'ArrowLeft') {
                    setTab(active === 0 ? TAB_COUNT - 1 : active - 1);
                } else if (e.code === 'ArrowRight') {
                    setTab((active + 1) % TAB_COUNT);
                }
            }
        });
}

function setTab(ti: number) {
    Object
        .values(EL_TAB_BUTTONS)
        .forEach((b, bi) => {
            b.setAttribute('aria-selected', String(bi === ti));
            b.tabIndex = bi === ti ? 0 : -1;
        });
    Object
        .values(EL_TAB_BODIES)
        .forEach((b, bi) => bi === ti ? b.removeAttribute('hidden') : b.setAttribute('hidden', ''));
    Object
        .values(EL_TAB_BUTTONS)[ti]
        .focus();

    if (checkNewData()) {
        render();
    }

    if (ti === Tab.Map) {
        animateMap();
    }
}

function render() {
    if (resizeDebounce === -1) {
        setTimeout(() => {
            const
                TAB_BODY_ACTIVE = Object
                    .values(EL_TAB_BODIES)
                    .find(b => !b.hasAttribute('hidden')),
                TAB_BODY_WIDTH = TAB_BODY_ACTIVE!.clientWidth,
                TAB_BODY_HEIGHT = TAB_BODY_ACTIVE!.clientHeight;

            renderRoutes(EL_TAB_BODIES[Tab.Routes], TAB_BODY_WIDTH, TAB_BODY_HEIGHT);
            renderCharts(EL_TAB_BODIES[Tab.Charts]);
            renderMap(EL_TAB_BODIES[Tab.Map],TAB_BODY_WIDTH, TAB_BODY_HEIGHT);
            if (TAB_BODY_ACTIVE == EL_TAB_BODIES[Tab.Map]) {
                animateMap();
            }
        });
    }
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => resizeDebounce = -1, 500);
}

init();