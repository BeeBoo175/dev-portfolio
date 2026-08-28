import type { OrbitConfig } from "./types";

export const CENTRAL_BODY: OrbitConfig = {
    id: "home",
    radius: 2,
    rotationSpeed: 0.2,
    color: "#ffd76b",
};

export const ORBIT_LAYOUT: OrbitConfig[] = [
    {
        id: "about",
        radius: 0.8,
        rotationSpeed: 0.5,
        orbitRadius: 6,
        orbitSpeed: 0.2,
        initialAngle: 0,
        color: "#5da9ff",
    },
    {
        id: "skills",
        radius: 0.9,
        rotationSpeed: 0.4,
        orbitRadius: 10,
        orbitSpeed: 0.15,
        initialAngle: Math.PI / 4,
        color: "#ffb15d",
        children: [
            {
                id: "skills-moon-1",
                radius: 0.2,
                rotationSpeed: 0.5,
                orbitRadius: 1.6,
                orbitSpeed: 1,
                color: "#ffe0b2",
            },
        ],
    },
    {
        id: "projects",
        radius: 1.1,
        rotationSpeed: 0.3,
        orbitRadius: 14,
        orbitSpeed: 0.1,
        initialAngle: Math.PI / 2,
        color: "#7dff9c",
        children: [
            {
                id: "projects-moon-1",
                radius: 0.18,
                rotationSpeed: 0.7,
                orbitRadius: 1.8,
                orbitSpeed: 0.8,
                color: "#b9f6ca",
            },
            {
                id: "projects-moon-2",
                radius: 0.12,
                rotationSpeed: 1,
                orbitRadius: 2.4,
                orbitSpeed: 0.5,
                color: "#a7f3d0",
            },
        ],
    },
    {
        id: "contact",
        radius: 0.7,
        rotationSpeed: 0.6,
        orbitRadius: 18,
        orbitSpeed: 0.08,
        initialAngle: Math.PI,
        color: "#ff5d8f",
        children: [
            {
                id: "contact-moon-1",
                radius: 0.16,
                rotationSpeed: 0.5,
                orbitRadius: 1.5,
                orbitSpeed: 0.7,
                color: "#fbcfe8",
            },
        ],
    },
];