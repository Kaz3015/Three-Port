import * as THREE from "three/webgpu";
export function createGrassBlade(width, height, segments, bend) {
    const geometry = new THREE.BufferGeometry();

    const positions = [];
    const uvs = [];
    const indices = [];

    // 1. Generate Vertices (Positions)
    for (let i = 0; i <= segments; i++) {
        // t is a value from 0.0 (bottom) to 1.0 (top)
        const t = i / segments;

        // TAPER: Width gets smaller as t goes up
        // We use (1 - t) so it's 100% width at bottom, 0% at top
        const currentWidth = width * (1 - t);

        // CURVE: Parabolic curve formula (y = x^2)
        // As we go up (t increases), we shift X to the right
        const xOffset = bend * (t * t);

        // Calculate X, Y, Z
        // We create two points per segment level: Left and Right

        // Left Point
        positions.push(xOffset - currentWidth / 2); // x
        positions.push(height * t);                 // y
        positions.push(0);                          // z

        // Right Point
        positions.push(xOffset + currentWidth / 2); // x
        positions.push(height * t);                 // y
        positions.push(0);                          // z

        // Generate UVs (for texture mapping or gradients)
        uvs.push(0, t); // Left UV
        uvs.push(1, t); // Right UV
    }

    // 2. Generate Indices (Connecting the dots)
    for (let i = 0; i < segments; i++) {
        const vertexIndex = i * 2;

        // Each segment is a rectangle made of 2 triangles
        // Triangle 1: Bottom Left -> Top Left -> Bottom Right
        indices.push(vertexIndex, vertexIndex + 2, vertexIndex + 1);

        // Triangle 2: Bottom Right -> Top Left -> Top Right
        indices.push(vertexIndex + 1, vertexIndex + 2, vertexIndex + 3);
    }

    // 3. Assign attributes to geometry
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    // Important for lighting to interact with the curve correctly
    geometry.computeVertexNormals();

    return geometry;
}