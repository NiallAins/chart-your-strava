import { render as renderPoster } from "./poster.js";
import { render as renderChart } from "./chart.js";
import { checkNewData } from "./data.js";
import { init as initLoader } from "./load.js";
const EL_TAB_BUTTONS = [
    document.getElementById('tabButton_poster'),
    document.getElementById('tabButton_chart'),
    document.getElementById('tabButton_load')
], EL_TAB_BODIES = [
    document.getElementById('tabBody_poster'),
    document.getElementById('tabBody_chart'),
    document.getElementById('tabBody_load')
];
let resizeDebounce = -1;
function initTabs() {
    EL_TAB_BUTTONS.forEach((b, bi) => {
        b.onclick = () => setTab(bi);
        b.onkeydown = e => {
            const active = EL_TAB_BUTTONS.findIndex(b => b.getAttribute('aria-selected') === 'true');
            if (e.code === 'ArrowLeft') {
                setTab(active === 0 ? EL_TAB_BUTTONS.length - 1 : active - 1);
            }
            else if (e.code === 'ArrowRight') {
                setTab((active + 1) % EL_TAB_BUTTONS.length);
            }
        };
    });
}
function setTab(ti) {
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
        renderPoster(EL_TAB_BODIES[0]);
        renderChart(EL_TAB_BODIES[1]);
    }
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => resizeDebounce = -1, 500);
}
window.onresize = render;
initTabs();
initLoader(EL_TAB_BODIES[2]);
setTab(0);
