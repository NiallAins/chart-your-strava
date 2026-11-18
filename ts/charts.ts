import { loadData } from './data.js';
import { Bar, Datum } from './types.js';
import { decodePath, getDataColor, getIntensityLimits, getIntensity } from './util.js';

let hoverTimeout = -1;

const
    COLOR_PATH = '#ffffff',
    WIDTH_PATH = 2;

export function render(parentEl: HTMLElement) {
    const
        CAN = document.createElement('canvas'),
        CTX = CAN.getContext('2d')!;
    CAN.classList.add('charts__canvas');

    const
        EL_CONTAINER = document.createElement('div'),
        EL_DETAIL = document.createElement('div');
    EL_CONTAINER.classList.add('charts__container');
    EL_DETAIL.classList.add('charts__detail');

    const
        RUN_DATA = loadData(),
        INTENSITY_LIMITS = getIntensityLimits(RUN_DATA),
        BARS = RUN_DATA.map((d, di) => ({
            x: di,
            y: d.l,
            n: d.n,
            c: getDataColor(d, INTENSITY_LIMITS)
        }));

    addBarGraph(
        EL_CONTAINER,
        BARS,
        [
            [10000, '10k'],
            [21000, '21k'],
            [42000, '42k']
        ],
        di => focusEntry(RUN_DATA[di], INTENSITY_LIMITS, EL_DETAIL, CTX),
        () => clearEntry(EL_DETAIL, CTX)
    );
    
    parentEl.innerHTML = '';
    parentEl.appendChild(CAN);
    parentEl.appendChild(EL_CONTAINER);
    EL_CONTAINER.appendChild(EL_DETAIL);
}

function addBarGraph(
    parentEl: HTMLElement,
    data: Bar[],
    yMarks: [number, string][],
    hoverCb: (di: number) => void,
    unhoverCb: () => void,
) {
    const
        MAX_X = data.reduce((max, d) => Math.max(max, d.x), -Infinity) + 1,
        MIN_X = data.reduce((min, d) => Math.min(min, d.x), Infinity),
        MAX_Y = data.reduce((max, d) => Math.max(max, d.y), -Infinity),
        MIN_Y = 0,//data.reduce((min, d) => Math.min(min, d[1]), Infinity) * 0.75,
        WIDTH = 100 / (MAX_X - MIN_X),
        FULL_WIDTH = WIDTH * data.length,
        getY = (y: number) => ((y - MIN_Y) / (MAX_Y - MIN_Y)) * FULL_WIDTH;

    parentEl.innerHTML += `
        <div class="charts__marks">
            ${
                yMarks
                    .map(y => `
                        <span
                            class="charts__marks-y"
                            style="bottom: ${ getY(y[0]) }%"
                        >${
                            y[1]
                        }</span>
                    `)
                    .join('')
            }
        </div>
    `;

    const EL_BAR_CONTAINER = document.createElement('div');
    EL_BAR_CONTAINER.classList.add('charts__bars');
    data.forEach((d, di) => {
        const EL_BAR = document.createElement('div');
        EL_BAR.classList.add('charts__bars-bar');
        EL_BAR.style.width = WIDTH + '%';
        EL_BAR.style.background = `linear-gradient(#0000 ${ 100 - getY(d.y) }%, ${ d.c } 0)`;
        EL_BAR.innerHTML = `<span class="charts__label">${ d.n }</span>`;
        EL_BAR.onmouseover = () => hoverCb(di);
        EL_BAR.onmouseleave = unhoverCb;
        EL_BAR_CONTAINER.appendChild(EL_BAR);
    });

    parentEl.appendChild(EL_BAR_CONTAINER);
}

function focusEntry(datum: Datum, intensityLimits: [number, number], detailEl: HTMLElement, ctx: CanvasRenderingContext2D) {
    hoverBar(datum, ctx);

    const
        PACE = 16.6666 / datum.s,
        DETAILS: [any, string | number, string?][] = [
            [datum.d, new Date(datum.d).toString().substring(0, 15)],
            [datum.l, (datum.l / 1000).toFixed(2), 'km'],
            [
                datum.t,
                (datum.t >= 3600 ? Math.floor(datum.t / 3600) + ':' : '') +
                (Math.floor((datum.t % 3600) / 60).toString().padStart(2, '0')) + ':' +
                Math.ceil(datum.t % 60).toString().padStart(2, '0')
            ],
            [
                PACE,
                Math.floor(PACE) + ':' +
                Math.round((PACE % 1) * 60).toString().padStart(2, '0'),
                'min/km'
            ],
            [datum.e[2], Math.floor(datum.e[2]), 'm ascent'],
            [datum.h, Math.round(datum.h), 'bpm avg'],
            [datum.hm, Math.round(datum.hm), 'bpm max'],
            [
                datum.h * datum.hm,
                Math.round(100 * (getIntensity(datum) - intensityLimits[0]) / (intensityLimits[1] - intensityLimits[0])),
                '% effort'
            ]
        ];

    detailEl.innerHTML = `
        <span class="charts__detail-title">
            ${ datum.n || 'Activity' }
        </span>
        ${
            DETAILS
                .filter(d => typeof d[0] || d[0] === 0)
                .map(d => `<span>${ d[1] } ${ d[2] || '' }</span>`)
                .join('\n')
        }
    `;
}

function hoverBar(d: Datum, ctx: CanvasRenderingContext2D) {
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => drawPath(d, ctx), 50);
}

function clearEntry(detailEl: HTMLElement, ctx: CanvasRenderingContext2D) {
    clearTimeout(hoverTimeout);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    detailEl.innerHTML = '';
}

function drawPath(d: Datum, ctx: CanvasRenderingContext2D) {
    const
        PATH = decodePath(d.p).map(p => ({ x: p[0], y: p[1] * -1 })),
        PATH_X = PATH.map(p => p.x),
        PATH_Y = PATH.map(p => p.y),
        MIN_X = Math.min(...PATH_X),
        X_DIFF = Math.max(...PATH_X) - MIN_X,
        MIN_Y = Math.min(...PATH_Y),
        Y_DIFF = Math.max(...PATH_Y) - MIN_Y,
        PATH_RATIO = X_DIFF / Y_DIFF,
        WIN_RATIO = window.innerWidth / window.innerHeight,
        SCALE = PATH_RATIO > WIN_RATIO
            ? (window.innerWidth * 0.75) / X_DIFF
            : (window.innerHeight * 0.75) / Y_DIFF;
  
    ctx.canvas.width = X_DIFF * SCALE;
    ctx.canvas.height = Y_DIFF * SCALE;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
        PATH.forEach(p => ctx.lineTo(
            (p.x - MIN_X) * SCALE,
            (p.y - MIN_Y) * SCALE
        ));
    ctx.lineWidth = WIDTH_PATH;
    ctx.strokeStyle = COLOR_PATH;
    ctx.stroke();
}