export interface OrbitConfig {
    id: string;
    radius: number;
    rotationSpeed: number;
    orbitRadius?: number;
    orbitSpeed?: number;
    initialAngle?: number;
    color?: string;
    children?: OrbitConfig[];
}