import { ArrowHelper, BoxGeometry, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { CubeMesh } from "./types";
import { AXIS_COLOR_X, AXIS_COLOR_Y, AXIS_COLOR_Z } from "./consts";

export function createCube(size: number, color: number) {
    const geometry = new BoxGeometry(size, size, size);
    const material = new MeshBasicMaterial({ color, transparent: true });
    const cube = new Mesh(geometry, material);
    cube.userData.state = {
        type: "Cube",
        readyForStateChange: false,
        isSelected: false,
        isIntersected: false,
        edges: null,
        arrowX: null,
        arrowY: null,
        arrowZ: null,
    };
    
    cube.userData.prevState = {
        type: "Cube",
        readyForStateChange: false,
        isSelected: false,
        isIntersected: false,
        edges: null,
        arrowX: null,
        arrowY: null,
        arrowZ: null,
    };

    const dirX = new Vector3(1, 0, 0);
    const dirY = new Vector3(0, 1, 0);
    const dirZ = new Vector3(0, 0, 1);
    
    const arrowX = new ArrowHelper(dirX, cube.position, 1.5, AXIS_COLOR_X, 0.4, 0.1);
    arrowX.userData.state = {
        type: "Arrow",
        isIntersected: false,
        isDragging: false,
        axis: "X",
    };
    const arrowY = new ArrowHelper(dirY, cube.position, 1.5, AXIS_COLOR_Y, 0.4, 0.1);
    arrowY.userData.state = {
        type: "Arrow",
        isIntersected: false,
        isDragging: false,
        axis: "Y",
    };
    const arrowZ = new ArrowHelper(dirZ, cube.position, 1.5, AXIS_COLOR_Z, 0.4, 0.1);
    arrowZ.userData.state = {
        type: "Arrow",
        isIntersected: false,
        isDragging: false,
        axis: "Z",
    };

    cube.userData.state.arrowX = arrowX;
    cube.userData.state.arrowY = arrowY;
    cube.userData.state.arrowZ = arrowZ;

    hideArrows(cube);

    cube.add(arrowX);
    cube.add(arrowY);
    cube.add(arrowZ);

    return cube;
}

export function applyStateChange(cube: CubeMesh) {
    if(!cube.userData.state.readyForStateChange) {
        return;
    }

    if(cube.userData.state.isSelected !== cube.userData.prevState.isSelected) {
        if(cube.userData.state.isSelected) {
            showArrows(cube);
            highlightCube(cube, 0x332233);
        } else {
            hideArrows(cube)
            unhighlightCube(cube);
            cube.material.opacity = 1.0;
        }
    }

    if(cube.userData.state.isIntersected !== cube.userData.prevState.isIntersected) {
        if(cube.userData.state.isIntersected) {
            cube.material.transparent = true;
            cube.material.opacity = 0.3;
        } else {
            if(!cube.userData.state.isSelected) {
                cube.material.opacity = 1.0;
            }
        }
    }


    cube.userData.readyForStateChange = false;
    cube.userData.prevState = { ...cube.userData.state };
}

export function showArrows(cube: CubeMesh) {
    cube.userData.state.arrowX.visible = true;
    cube.userData.state.arrowY.visible = true;
    cube.userData.state.arrowZ.visible = true;
}

export function hideArrows(cube: CubeMesh) {
    cube.userData.state.arrowX.visible = false;
    cube.userData.state.arrowY.visible = false;
    cube.userData.state.arrowZ.visible = false;
}

export function highlightCube(cube: CubeMesh, color: number) {
    const edgesGeometry = new EdgesGeometry(cube.geometry);
    const edgesMaterial = new LineBasicMaterial({ color });
    const edges = new LineSegments(edgesGeometry, edgesMaterial);

    cube.add(edges);
    cube.userData.state.edges = edges;
}

export function unhighlightCube(cube: CubeMesh) {
    if(cube.userData.state.edges) {
        cube.remove(cube.userData.state.edges);
        cube.userData.state.edges = null;
    }
}