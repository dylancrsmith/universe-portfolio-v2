import { initScene, animate } from "./core/scene.js";
import { createPlanets } from "./universe/planets.js";
import { setupUI } from "./ui/ui.js";

const { scene, camera } = initScene();

createPlanets(scene);
setupUI(camera);

animate();
