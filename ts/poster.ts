import { loadData } from './data.js';
import { Datum } from './types.js';
import { decodePath, getDataColor, getIntensityLimits } from './util.js';

export function render(parentEl: HTMLElement) {
    parentEl.innerHTML = '';

    const
        W = parentEl.clientWidth,
        H = parentEl.clientHeight;
    
    let
        data = loadData().filter(d => d.p),
        dim = Math.ceil(1 + Math.sqrt(data.length / (H / W)));
    
    const INTENSITY_LIMITS = getIntensityLimits(data);

    data.forEach(d => parentEl.appendChild(
        getPathCanvas(
            d,
            Math.floor((W / dim) - 2),
            Math.floor((H / Math.ceil(data.length / dim)) - 2),
            INTENSITY_LIMITS
        ))
    );
}

function getPathCanvas(d: Datum, w: number, h: number, colorLimits: [number, number]) {
    const
        CAN = document.createElement('canvas'),
        CTX = CAN.getContext('2d')!,
        PATH = decodePath(d.p).map(p => [p[0], p[1] * -1]),
        MIN_X = PATH.reduce((min, p) => Math.min(min, p[0]), Infinity),
        X_DIFF = PATH.reduce((max, p) => Math.max(max, p[0]), -Infinity) - MIN_X,
        MIN_Y = PATH.reduce((min, p) => Math.min(min, p[1]), Infinity),
        Y_DIFF = PATH.reduce((max, p) => Math.max(max, p[1]), -Infinity) - MIN_Y,
        SCALE = Math.min(w, h) / Math.max(X_DIFF, Y_DIFF);
    
    CAN.width = w;
    CAN.height = h;
    X_DIFF > Y_DIFF
        ? CTX.translate(0, (h - (Y_DIFF * SCALE)) * 0.5)
        : CTX.translate((w - (X_DIFF * SCALE)) * 0.5, 0);
    
    CTX.fillStyle = '#fff2';
    CTX.font = '12px Helvetica';
    CTX.strokeStyle = getDataColor(d, colorLimits);
    CTX.lineWidth = 2;
    CTX.beginPath();
        PATH.forEach(p => CTX.lineTo(
            (p[0] - MIN_X) * SCALE,
            (p[1] - MIN_Y) * SCALE
        ));
    CTX.stroke();
    
    return CAN;
}