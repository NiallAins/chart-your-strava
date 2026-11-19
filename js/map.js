import { loadData } from './data.js';
import { decodePath, getDataColor, getIntensityLimits } from './util.js';
const TARGET_FRAMES = 60 * 8;
let animationFrame = -1, isAnimated = true, zoomFactor = 1;
export let animate = () => { };
export function render(parentEl, parentElW, parentElH) {
    parentEl.innerHTML = '';
    const EL_BUTTON_CONTAINER = document.createElement('div'), EL_BUTTON_ZOOM_OUT = document.createElement('button'), EL_BUTTON_ZOOM_IN = document.createElement('button'), EL_BUTTON_ANIMATE = document.createElement('button');
    const CAN = document.createElement('canvas'), CAN_OVERLAY = document.createElement('canvas'), CTX = CAN.getContext('2d'), CTX_OVERLAY = CAN_OVERLAY.getContext('2d');
    const DATA = loadData(), INTENSITY_LIMITS = getIntensityLimits(DATA), PATH = DATA
        .map(d => decodePath(d.p)
        .map((p, pi) => [
        p[0],
        p[1] * -1,
        pi === 0 ? getDataColor(d, INTENSITY_LIMITS) : ''
    ])
        .filter(p => !isNaN(p[0] * p[1])))
        .flat(), [MIN_X, MIN_Y, DIFF_X, DIFF_Y, SCALE] = getPathRange(PATH, parentElW, parentElH), SCALED_PATH = applyPathRange(PATH, MIN_X, MIN_Y, SCALE);
    CAN.width = CAN_OVERLAY.width = parentElW;
    CAN.height = CAN_OVERLAY.height = parentElH;
    CTX.save();
    CTX_OVERLAY.save();
    animate = () => {
        cancelAnimationFrame(animationFrame);
        CTX.restore();
        CTX_OVERLAY.restore();
        CTX.save();
        CTX_OVERLAY.save();
        clearCanvas(CTX);
        CTX.lineWidth = 2 / zoomFactor;
        CTX.globalAlpha = 0.3;
        CTX_OVERLAY.fillStyle = 'orangered';
        if (DIFF_X < DIFF_Y) {
            CTX.translate((parentElW - (DIFF_X * SCALE)) * 0.5, 0);
            CTX_OVERLAY.translate((parentElW - (DIFF_X * SCALE)) * 0.5, 0);
        }
        else {
            CTX.translate(0, (parentElH - (DIFF_Y * SCALE)) * 0.5);
            CTX_OVERLAY.translate(0, (parentElH - (DIFF_Y * SCALE)) * 0.5);
        }
        CTX.scale(zoomFactor, zoomFactor);
        CTX_OVERLAY.scale(zoomFactor, zoomFactor);
        animatePath(SCALED_PATH, CTX, CTX_OVERLAY, Math.round(PATH.length / TARGET_FRAMES));
    };
    CAN.classList.add('map__canvas');
    CAN_OVERLAY.classList.add('map__canvas');
    EL_BUTTON_CONTAINER.classList.add('map__buttons');
    EL_BUTTON_ZOOM_OUT.classList.add('map__buttons-button', 'map__buttons-button-zoom-out');
    EL_BUTTON_ZOOM_IN.classList.add('map__buttons-button', 'map__buttons-button-zoom-in');
    EL_BUTTON_ANIMATE.classList.add('map__buttons-button', 'map__buttons-button-draw');
    EL_BUTTON_ZOOM_OUT.innerHTML = 'Zoom &minus;';
    EL_BUTTON_ZOOM_IN.innerHTML = 'Zoom &plus;';
    EL_BUTTON_ANIMATE.innerHTML = 'Toggle animation';
    EL_BUTTON_ZOOM_OUT.onclick = () => { zoomFactor /= 1.5; animate(); };
    EL_BUTTON_ZOOM_IN.onclick = () => { zoomFactor *= 1.5; animate(); };
    EL_BUTTON_ANIMATE.onclick = () => { isAnimated = !isAnimated; animate(); };
    EL_BUTTON_CONTAINER.appendChild(EL_BUTTON_ANIMATE);
    EL_BUTTON_CONTAINER.appendChild(EL_BUTTON_ZOOM_OUT);
    EL_BUTTON_CONTAINER.appendChild(EL_BUTTON_ZOOM_IN);
    parentEl.appendChild(CAN);
    parentEl.appendChild(CAN_OVERLAY);
    parentEl.appendChild(EL_BUTTON_CONTAINER);
}
function getPathRange(path, canW, canH) {
    const AVG_X = path.reduce((sum, p) => sum + p[0], 0) / path.length, AVG_Y = path.reduce((sum, p) => sum + p[1], 0) / path.length, MAX_RANGE = 0.125;
    const MIN_X = AVG_X - MAX_RANGE, DIFF_X = MAX_RANGE * 2, MIN_Y = AVG_Y - MAX_RANGE, DIFF_Y = MAX_RANGE * 2, SCALE = Math.min(canW, canH) / Math.max(DIFF_X, DIFF_Y);
    return [MIN_X, MIN_Y, DIFF_X, DIFF_Y, SCALE];
}
function applyPathRange(path, minX, minY, scale) {
    return path.map(p => [
        (p[0] - minX) * scale,
        (p[1] - minY) * scale,
        p[2]
    ]);
}
function animatePath(path, ctx, ctxOverlay, perFrame, i = 0) {
    const END_FRAME = Math.min(i + perFrame, path.length - 1);
    ctx.beginPath();
    let p = path[i];
    for (; i < END_FRAME; i++) {
        ctx.moveTo(p[0], p[1]);
        p = path[i + 1];
        if (p[2]) {
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = p[2];
            ctx.moveTo(p[0], p[1]);
        }
        else {
            ctx.lineTo(p[0], p[1]);
        }
    }
    ctx.stroke();
    clearCanvas(ctxOverlay);
    ctxOverlay.beginPath();
    ctxOverlay.arc(p[0], p[1], 3 / zoomFactor, 0, Math.PI * 2);
    ctxOverlay.fill();
    if (i < path.length - 1) {
        const nextFrame = () => animatePath(path, ctx, ctxOverlay, perFrame, i - 1);
        if (isAnimated) {
            animationFrame = window.requestAnimationFrame(nextFrame);
        }
        else {
            nextFrame();
        }
    }
    else {
        clearCanvas(ctxOverlay);
    }
}
function clearCanvas(ctx) {
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
}
