const TIMING = {
  drawerDuration: 300, // ms (CSS transition equivalent)
  animationDelay: 120, // delay before starting animation
  frameSpeed: 40, // ms per frame
};

let animationTimeouts = {};
let activeRAF = {};

const ICON_SIZE = 100;
const baseWidth = 800;
const baseHeight = 600;
const drawerOpen = [false, false, false];
const projectsContainer = document.getElementById("projects-container");
const icons = document.querySelectorAll(".project-icon");
const stage = document.getElementById("stage");
const overlays = document.querySelectorAll(".project-overlay");

const drawerMoves = [
  { x: 95 / baseWidth, y: 102 / baseHeight }, // drawer 0
  { x: 95 / baseWidth, y: 102 / baseHeight }, // drawer 1
  { x: 95 / baseWidth, y: 102 / baseHeight }, // drawer 2
];

const darioFrames = [
  "pictures/Animation-Dario-1.png",
  "pictures/Animation-Dario-2.png",
  "pictures/Animation-Dario-3.png",
  "pictures/Animation-Dario-4.png",
  "pictures/Animation-Dario-5.png",
  "pictures/Animation-Dario-6.png",
];

const projectFrames = [
  "pictures/Animation-Projects-1.png",
  "pictures/Animation-Projects-2.png",
  "pictures/Animation-Projects-3.png",
  "pictures/Animation-Projects-4.png",
  "pictures/Animation-Projects-5.png",
  "pictures/Animation-Projects-6.png",
  "pictures/Animation-Projects-7.png",
];

// Opens Projectpages linked to Icons
document.querySelectorAll(".project-icon").forEach((icon) => {
  icon.addEventListener("click", () => {
    const projectId = icon.dataset.project;

    openOverlay(projectId);
  });
});

document.documentElement.style.setProperty(
  "--drawer-duration",
  `${TIMING.drawerDuration}ms`,
);

document.querySelectorAll("#drawer_hitarea path").forEach((path) => {
  path.addEventListener("click", () => {
    const id = Number(path.dataset.drawer);
    toggleDrawer(id);
  });
});

function openAnimation(id) {
  if (id === 0) {
    playFrameAnimation("animation_dario", darioFrames);
  }

  if (id === 1) {
    playFrameAnimation("animation_projects", projectFrames);
  }
}

function closeAnimation(id) {
  if (id === 0) {
    document.getElementById("animation_dario").style.opacity = 0;
  }

  if (id === 1) {
    document.getElementById("animation_projects").style.opacity = 0;
  }
}

function playFrameAnimation(elementId, frames, speed = TIMING.frameSpeed) {
  const element = document.getElementById(elementId);

  if (activeRAF[elementId]) {
    cancelAnimationFrame(activeRAF[elementId]);
    delete activeRAF[elementId];
  }

  let frame = 0;
  let lastTime = 0;

  element.style.opacity = 1;
  element.src = frames[0];

  function loop(time) {
    if (!lastTime) lastTime = time;

    if (time - lastTime >= speed) {
      frame++;

      if (frame >= frames.length) {
        delete activeRAF[elementId];
        return;
      }

      element.src = frames[frame];
      lastTime = time;
    }

    activeRAF[elementId] = requestAnimationFrame(loop);
  }

  activeRAF[elementId] = requestAnimationFrame(loop);
}

function setDrawer(id, isOpen) {
  drawerOpen[id] = isOpen;

  const visual = document.querySelector(`.drawer_wrapper[data-drawer="${id}"]`);
  const hit = document.querySelector(
    `#drawer_hitarea path[data-drawer="${id}"]`,
  );

  const stageWidth = stage.offsetWidth;
  const scale = stageWidth / baseWidth;

  if (visual) {
    visual.classList.toggle("drawer_open", isOpen);

    if (isOpen) {
      const move = drawerMoves[id];
      const dx = move.x * baseWidth * scale;
      const dy = move.y * baseHeight * scale;

      // Visual drawer
      visual.style.transform = `translate(${dx}px, ${dy}px)`;

      // SVG hit area — apply a "tweak factor" to exaggerate movement
      const svgFactor = 3.4; // tweak this to make SVG move more intensely
      hit.style.transform = `translate(${dx * svgFactor}px, ${dy * svgFactor}px)`;
    } else {
      visual.style.transform = `translate(0px,0px)`;
      hit.style.transform = `translate(0px,0px)`;
    }
  }

  const darioTextTop = document.getElementById("dario-text-top");
  const darioTextBottom = document.getElementById("dario-text-bottom");
  const contactText = document.getElementById("contact-text");

  // Top Drawer
  if (id === 0) {
    if (isOpen) {
      darioTextTop.classList.add("visible");
      darioTextBottom.classList.add("visible");
    } else {
      darioTextTop.classList.remove("visible");
      darioTextBottom.classList.remove("visible");
    }
  }

  // Middle Drawer
  if (id === 1) {
    if (isOpen) {
      placeIcons();

      setTimeout(() => {
        projectsContainer.classList.add("visible");

        icons.forEach((icon, index) => {
          setTimeout(() => {
            icon.style.opacity = 1;
            icon.style.transform = "translateY(0px)";
          }, index * 80);
        });
      }, TIMING.drawerDuration);
    } else {
      projectsContainer.classList.remove("visible");

      icons.forEach((icon) => {
        icon.style.opacity = 0;
        icon.style.transform = "translateY(20px)";
      });
    }
  }

  // Bottom Drawer
  if (id === 2) {
    if (isOpen) {
      setTimeout(
        () => contactText.classList.add("visible"),
        TIMING.drawerDuration,
      );
    } else {
      contactText.classList.remove("visible");
    }
  }

  if (isOpen) {
    // clear any previous scheduled animation for this drawer
    if (animationTimeouts[id]) {
      clearTimeout(animationTimeouts[id]);
    }

    animationTimeouts[id] = setTimeout(() => {
      if (drawerOpen[id]) openAnimation(id);
    }, TIMING.animationDelay);
  } else {
    closeAnimation(id);
  }
}

function toggleDrawer(id) {
  const isCurrentlyOpen = drawerOpen[id];

  if (isCurrentlyOpen) {
    // If clicked drawer is already open, just close it
    setDrawer(id, false);
  } else {
    // Close any other open drawer first
    drawerOpen.forEach((open, otherId) => {
      if (open && otherId !== id) {
        setDrawer(otherId, false);
      }
    });

    // Open the clicked drawer AFTER closing others
    setDrawer(id, true);
  }
}

function updateScale() {
  const scale = Math.min(
    window.innerWidth / baseWidth,
    window.innerHeight / 600,
  );

  stage.style.transform = `scale(${scale})`;

  // update drawers positions
  updateDrawerTransformsOnly();
}

window.addEventListener("resize", updateScale);
window.addEventListener("load", updateScale);
updateScale();

// helper function
function isIconPositionValid(x, y, iconSize, maskPath) {
  const svg = maskPath.ownerSVGElement;

  const points = [
    [x + iconSize / 2, y + iconSize / 2],
    [x, y],
    [x + iconSize, y],
    [x, y + iconSize],
    [x + iconSize, y + iconSize],
  ];

  return !points.some(([px, py]) => {
    const point = svg.createSVGPoint();
    point.x = px;
    point.y = py;

    // THIS is the missing piece:
    const transformed = point.matrixTransform(
      maskPath.getScreenCTM().inverse(),
    );

    return maskPath.isPointInFill(transformed);
  });
}

function placeIcons() {
  const maskPath = document.getElementById("furniture-path");
  const container = document.getElementById("projects-container");
  const containerRect = container.getBoundingClientRect();

  const SAFE_MARGIN = 40; // distance from edges
  const gridSize = ICON_SIZE / 4; // finer grid for more placement options

  const svg = maskPath.ownerSVGElement;
  const scaleX = svg.viewBox.baseVal.width / containerRect.width;
  const scaleY = svg.viewBox.baseVal.height / containerRect.height;

  const placed = [];

  icons.forEach((icon) => {
    let placedSuccessfully = false;

    // Generate a list of all possible positions
    const positions = [];
    for (
      let x = SAFE_MARGIN;
      x <= containerRect.width - ICON_SIZE - SAFE_MARGIN;
      x += gridSize
    ) {
      for (
        let y = SAFE_MARGIN;
        y <= containerRect.height - ICON_SIZE - SAFE_MARGIN;
        y += gridSize
      ) {
        positions.push({ x, y });
      }
    }

    // Shuffle positions to randomize placement
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Try to place icon
    for (const pos of positions) {
      const { x, y } = pos;

      // Check overlap with other icons
      const overlaps = placed.some(
        (other) => Math.hypot(other.x - x, other.y - y) < ICON_SIZE * 1.4,
      );
      if (overlaps) continue;

      // Check against furniture mask
      if (!isIconPositionValid(x, y, ICON_SIZE, maskPath, scaleX, scaleY)) {
        continue;
      }

      // Place icon
      icon.style.position = "absolute";
      icon.style.left = `${x}px`;
      icon.style.top = `${y}px`;

      placed.push({ x, y });
      placedSuccessfully = true;
      break;
    }

    if (!placedSuccessfully) console.warn("Could not place icon");
  });
}

document.querySelectorAll(".overlay-close").forEach((button) => {
  button.addEventListener("click", closeAllOverlays);
});

document.querySelectorAll(".overlay-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", closeAllOverlays);
});

function openOverlay(projectId) {
  closeAllOverlays();

  const overlay = document.querySelector(
    `.project-overlay[data-overlay="${projectId}"]`,
  );

  if (overlay) {
    overlay.classList.add("open");
  }
}

function closeAllOverlays() {
  overlays.forEach((overlay) => {
    overlay.classList.remove("open");
  });
}

function updateDrawerTransformsOnly() {
  const stageWidth = stage.offsetWidth;
  const scale = stageWidth / baseWidth;

  drawerOpen.forEach((isOpen, id) => {
    const visual = document.querySelector(
      `.drawer_wrapper[data-drawer="${id}"]`,
    );
    const hit = document.querySelector(
      `#drawer_hitarea path[data-drawer="${id}"]`,
    );

    if (!visual || !hit) return;

    if (isOpen) {
      const move = drawerMoves[id];
      const dx = move.x * baseWidth * scale;
      const dy = move.y * baseHeight * scale;

      visual.style.transform = `translate(${dx}px, ${dy}px)`;

      const svgFactor = 3.4;
      hit.style.transform = `translate(${dx * svgFactor}px, ${dy * svgFactor}px)`;
    } else {
      visual.style.transform = `translate(0px,0px)`;
      hit.style.transform = `translate(0px,0px)`;
    }
  });
}
