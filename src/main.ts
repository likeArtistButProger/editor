import { Color, DirectionalLight, Object3D, Object3DEventMap, PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { CubeMesh } from './types';
import { CUBE_SIZE } from './consts';
import { applyStateChange, createCube } from './cube-helpers';
import { clamp } from 'three/src/math/MathUtils.js';

const resolution = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new Scene();
const renderer = new WebGLRenderer({ antialias: true });
document.body.appendChild(renderer.domElement);

renderer.setClearColor(Color.NAMES.skyblue);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(resolution.width, resolution.height);

const aspect = resolution.width / resolution.height;
const camera = new PerspectiveCamera(70, aspect, 0.1, 1000);

function onResize() {
  const resolution = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const aspect = resolution.width / resolution.height;

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(resolution.width, resolution.height);
}

camera.translateX(5);
camera.translateY(5);
camera.translateZ(5);

const light = new DirectionalLight(0xFFE484, 0.5);
scene.add(light);

const cube = createCube(CUBE_SIZE, 0xCCAA00);
cube.userData.state.selected = false;

camera.lookAt(cube.position);
scene.add(cube);

const raycaster = new Raycaster();
const mouse = new Vector2();

let isMouseDown = false;
let prevMousePos = new Vector2(0, 0);

function onMouseMove(e: MouseEvent) {
  mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

  if (isMouseDown) {
    const currentMousePos = new Vector2(mouse.x, mouse.y);
    const updatedPos = currentMousePos.sub(prevMousePos);

    const changeLength = updatedPos.length();
    let scaleChange = clamp(changeLength, 0, 1);

    const dragMap: Record<string, number | undefined> = {
      "X": 0,
      "Y": 0,
      "Z": 0,
    };

    const updatedPosUnit = updatedPos.normalize();
    const updatedX = updatedPosUnit.x;
    const updatedY = updatedPosUnit.y;
    
    scene.traverse((obj) => {
      for(const child of obj.children) {
        if(
          child.userData.state?.type === "Arrow"
          && child.userData.state?.isDragging) {            
            if(child.userData.state.axis === "X") {
              dragMap[child.userData.state.axis] = updatedX;
            }
            if(child.userData.state.axis === "Y") {
              dragMap[child.userData.state.axis] = updatedY;
            }
            if(child.userData.state.axis === "Z") {
              dragMap[child.userData.state.axis] = updatedX * updatedY;
            }
        }
      }
    });

    const scaleValue = new Vector3(dragMap["X"], dragMap["Y"], dragMap["Z"]).multiplyScalar(scaleChange);
    const minScale = new Vector3(0.1, 0.1, 0.1);
    const maxScale = new Vector3(5, 5, 5);

    for(const obj of scene.children) {
      if(
        obj.userData.state?.type === "Cube"
        && obj.userData.state?.isSelected
      ) {
        obj.scale.add(scaleValue).clamp(minScale, maxScale);
      }
    }

    prevMousePos = currentMousePos;
  }
}

function onSelectCube(_: MouseEvent) {
  for(const obj of scene.children) {
    if(obj.userData.state?.type !== "Cube") {
      continue;
    }

    if(obj.userData.state.isIntersected) {
      obj.userData.state.isSelected = true;
      obj.userData.state.readyForStateChange = true;
    } else {
      if(obj.userData.state.isSelected) {
        obj.userData.state.isSelected = false;
        obj.userData.state.readyForStateChange = true;
      }
    }
  }
}

function onMouseDown(_: MouseEvent) {
  if(isMouseDown) {
    return;
  }
  isMouseDown = true;

  let firstArrowClicked: Object3D<Object3DEventMap> | null = null;

  scene.traverse((obj) => {
    for(const child of obj.children) {
      if(
        child.userData.state?.type === "Arrow"
        && child.userData.state?.isIntersected
      ) {
        if (!firstArrowClicked) {
          firstArrowClicked = child;
        }
        child.userData.state.isDragging = true;
      }
    }
  });

  scene.traverse((obj) => {
    for (const child of obj.children) {
      if (
        child.userData.state?.type === "Arrow" &&
        child.userData.state?.isIntersected &&
        child !== firstArrowClicked
      ) {
        child.userData.state.isDragging = false;
      }
    }
  });
}

function onMouseUp(_: MouseEvent) {
  isMouseDown = false;
  scene.traverse((obj) => {
    for(const child of obj.children) {
      if(child.userData.state?.type === "Arrow") {
        child.userData.state.isDragging = false;
      }
    }
  });
}

window.addEventListener("click", onSelectCube);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mousedown", onMouseDown);
window.addEventListener("mouseup", onMouseUp);
window.addEventListener("resize", onResize);

function renderLoop() {
  requestAnimationFrame(renderLoop);

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const intersectedObj = intersects[0].object;

    if(intersectedObj.parent?.userData.state?.type === "Arrow") {
      intersectedObj.parent.userData.state.isIntersected = true;
    }

    if(intersectedObj.userData.state) {
      intersectedObj.userData.state.isIntersected = true;
      intersectedObj.userData.state.readyForStateChange = true;
    }
  } else {
    for(const obj of scene.children) {
      if(obj.userData.state?.type !== "Cube") {
        continue;
      }

      obj.children.forEach((child) => {
        if(child.userData.state?.type === "Arrow") {
          child.userData.state.isIntersected = false;
        }
      })

      if(obj.userData.state.isIntersected) {
        obj.userData.state.isIntersected = false;
        obj.userData.state.readyForStateChange = true;
      }
    }
  }

  for(const obj of scene.children) {
    if(obj.userData.state?.type !== "Cube") {
      continue;
    }

    applyStateChange(obj as CubeMesh);
  }

  renderer.render(scene, camera);
}

renderLoop();