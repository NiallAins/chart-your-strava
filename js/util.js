export function decodePath(pathStr) {
    const PATH = pathStr
        .split(';')
        .map(p => p
        .split(',')
        .map(c => parseInt(c) / 1e5));
    PATH.forEach((p, pi, arr) => arr[pi] = p.map((c, ci) => pi === 0 ? c : c + arr[pi - 1][ci]));
    return PATH;
}
export function getIntensityLimits(data) {
    return data
        .filter(d => d.h || d.hm)
        .reduce((lim, d) => [
        Math.min(lim[0], getIntensity(d)),
        Math.max(lim[1], getIntensity(d))
    ], [Infinity, -Infinity]);
}
export function getDataColor(d, intensityLimits) {
    const I = (getIntensity(d) - intensityLimits[0]) /
        (intensityLimits[1] - intensityLimits[0]);
    return `rgb(${Math.floor(255 * I)}, 0, ${Math.floor(255 * (1 - I))})`;
}
export function getIntensity(d) {
    return Math.pow((d.h || 160) + (d.hm || 185), 2);
}
