import * as THREE from "three";

const SKY_RADIUS = 600;
const STEP = 10;
const MAJOR = 30;
const ARC = 4;
const INK = "#1c3f8f";

function skyPoint(latitude: number, longitude: number) {
    const lat = THREE.MathUtils.degToRad(latitude);
    const lon = THREE.MathUtils.degToRad(longitude);
    return new THREE.Vector3(
        SKY_RADIUS * Math.cos(lat) * Math.cos(lon),
        SKY_RADIUS * Math.sin(lat),
        SKY_RADIUS * Math.cos(lat) * Math.sin(lon)
    );
}

function createGraticule(isMajor: boolean) {
    const points: THREE.Vector3[] = [];
    for (let lat = -80; lat <= 80; lat += STEP) {
        if ((lat % MAJOR === 0) !== isMajor) continue;
        for (let lon = 0; lon < 360; lon += ARC) points.push(skyPoint(lat, lon), skyPoint(lat, lon + ARC));
    }
    for (let lon = 0; lon < 360; lon += STEP) {
        if ((lon % MAJOR === 0) !== isMajor) continue;
        for (let lat = -88; lat < 88; lat += ARC) points.push(skyPoint(lat, lon), skyPoint(lat + ARC, lon));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
}

const MINOR_GEOMETRY = createGraticule(false);
const MAJOR_GEOMETRY = createGraticule(true);

/** Celestial coordinate sphere drawn behind the blueprint (light) theme. */
export function CelestialGrid() {
    return (
        <group rotation={[0, 0, 0.41]}>
            <lineSegments geometry={MINOR_GEOMETRY} renderOrder={-1}>
                <lineBasicMaterial color={INK} transparent opacity={0.1} depthWrite={false} />
            </lineSegments>
            <lineSegments geometry={MAJOR_GEOMETRY} renderOrder={-1}>
                <lineBasicMaterial color={INK} transparent opacity={0.2} depthWrite={false} />
            </lineSegments>
        </group>
    );
}

export default CelestialGrid;
