import { render as renderroutes } from "./routes.js";
import { render as renderCharts } from "./charts.js";
import { checkNewData } from "./data.js";
import { init as initLoader } from "./load.js";

const
    EL_TAB_BUTTONS = [
        document.getElementById('tabButton_routes'),
        document.getElementById('tabButton_charts'),
        document.getElementById('tabButton_load')
    ] as HTMLButtonElement[],
    EL_TAB_BODIES = [
        document.getElementById('tabBody_routes'),
        document.getElementById('tabBody_charts'),
        document.getElementById('tabBody_load')
    ] as HTMLElement[];

let resizeDebounce = -1;

function init() {
    const AUTH_REDIRECT = !!window.location.href.match('code=');
    window.onresize = () => render();
    initTabs();
    setTab(AUTH_REDIRECT ? 2 : 0);
    initLoader(EL_TAB_BODIES[2], AUTH_REDIRECT);
}

function initTabs() {
    EL_TAB_BUTTONS.forEach((b, bi) => {
        b.onclick = () => setTab(bi);
        b.onkeydown = e => {
            const active = EL_TAB_BUTTONS.findIndex(b => b.getAttribute('aria-selected') === 'true');
            if (e.code === 'ArrowLeft') {
                setTab(active === 0 ? EL_TAB_BUTTONS.length - 1 : active - 1);
            } else if (e.code === 'ArrowRight') {
                setTab((active + 1) % EL_TAB_BUTTONS.length);
            }
        }
    });
}

function setTab(ti: number) {
    EL_TAB_BUTTONS.forEach((b, bi) => {
        b.setAttribute('aria-selected', String(bi === ti));
        b.tabIndex = bi === ti ? 0 : -1;
    });
    EL_TAB_BODIES.forEach((b, bi) => bi === ti ? b.removeAttribute('hidden') : b.setAttribute('hidden', ''));
    EL_TAB_BUTTONS[ti].focus();

    if (checkNewData()) {
        render();
    }
}

function render() {
    if (resizeDebounce === -1) {
        renderroutes(EL_TAB_BODIES[0]);
        renderCharts(EL_TAB_BODIES[1]);
    }
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => resizeDebounce = -1, 500);
}

init();