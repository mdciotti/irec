function mix(a, b, t) {
    return (1.0 - t) * a + t * b;
}

function distanceSq(x0, y0, x1, y1) {
    return (x1 - x0)**2 + (y1 - y0)**2;
}

/**
 * Computes the height of a parabola at a given location, with known roots and vertex.
 * @param {number} height the vertical location of the parabola's vertex
 * @param {number} sx the x-coordinate of the first root
 * @param {number} sy the y-coordinate of the first root
 * @param {number} dx the x-coordinate of the second root
 * @param {number} dy the y-coordinate of the second root
 * @param {number} ratio the normalized position between the roots
 * @returns {number} the height of the parabola at this ratio
 */
function paraboloid(height, sx, sy, dx, dy, ratio) {
    const err = 1e-4;
    const x = mix(sx, dx, ratio) + err * Math.random();
    const y = mix(sy, dy, ratio) + err * Math.random();
    const cx = mix(sx, dx, 0.5);
    const cy = mix(sy, dy, 0.5);
    const dSourceCenterSq = distanceSq(sx, sy, cx, cy);
    const dXYCenterSq = distanceSq(x, y, cx, cy);
    const z = -height * dXYCenterSq / dSourceCenterSq + height;
    return [x, y, z + err * Math.random()];
}

/**
 * Creates fake parabolic data
 * @param {number} lat latitude
 * @param {number} lon longitude
 * @param {number} apogee vertex altitude in meters
 * @param {number} n number of data points to generate
 * @param {number} width width of the parabola (longitudinal coordinates)
 * @returns {Array<[number, number, number]>} the list of points in [lon, lat, alt] format
 */
function generate_parabola(lat, lon, apogee, n, width) {
    const data = [];

    for (let i = 0; i <= n; i += 1) {
        const t = i / n;
        data.push(paraboloid(apogee, lon, lat, lon + width, lat, t));
    }

    return data;
}

/**
 * Converts a numeric value into a string and pads with a character on the left
 * to fill up a given width.
 * @param {number} n the desired string width
 * @param {string} c the character to pad with
 * @param {number} val the numeric value to convert
 * @returns {string} the padded value
 */
function leftpad(n, c, val) {
    let str = val.toString();
    while (str.length < n) str = c + str;
    return str;
}

/**
 * Computes the character-wise XOR checksum of a given string.
 * @param {string} str the input string
 * @returns {number} the checksum byte
 */
function compute_checksum(str) {
    return Array.from(str).map(s => s.charCodeAt(0)).reduce((chk, c) => chk ^ c, 0);
}

const REF_DATE = new Date();
const RATE_HZ = 10;

function toNMEA(position, i) {
    const date = new Date(REF_DATE.getTime() + i * 1000 / RATE_HZ);
    const h = leftpad(2, '0', date.getUTCHours());
    const m = leftpad(2, '0', date.getUTCMinutes());
    const s = leftpad(2, '0', date.getUTCSeconds());
    const ms = Math.floor(date.getUTCMilliseconds() / 100).toString();
    const time = `${h}${m}${s}.${ms}`;

    let latitude = position[1];
    let longitude = position[0];
    const NS = latitude >= 0 ? 'N' : 'S';
    const EW = longitude >= 0 ? 'E' : 'W';
    latitude = Math.abs(latitude);
    longitude = Math.abs(longitude);
    let lat_arcmin = 60 * (latitude - Math.floor(latitude));
    lat_arcmin = leftpad(6, '0', lat_arcmin.toFixed(3));
    let lon_arcmin = 60 * (longitude - Math.floor(longitude));
    lon_arcmin = leftpad(6, '0', lon_arcmin.toFixed(3));
    const lat = `${leftpad(2, '0', Math.floor(latitude))}${lat_arcmin},${NS}`;
    const lon = `${leftpad(3, '0', Math.floor(longitude))}${lon_arcmin},${EW}`;

    const quality = 8; // fix quality (8 = simulation)
    const num_sat = '08'; // number of satellites being tracked
    const h_dil = '0.9'; // horizontal dilution of position
    const alt = `${position[2].toFixed(1)},M`; // altitude
    const h_geoid = '46.9,M'; // Height of geoid (mean sea level) above WGS84 ellipsoid
    const t_dgps = ''; // time in seconds since last DGPS update
    const dgps_id = ''; // DGPS station ID number

    const sentence = ['GPGGA', time, lat, lon, quality, num_sat, h_dil, alt, h_geoid, t_dgps, dgps_id].join(',');
    const chk = compute_checksum(sentence);
    const chk_hex = leftpad(2, '0', chk.toString(16)).toUpperCase();
    return `$${sentence}*${chk_hex}`;
}

const data = generate_parabola(32.990312, -106.975241, 3000, 200, 0.04);
const nmea_data = data.map(toNMEA);

module.exports = nmea_data;
