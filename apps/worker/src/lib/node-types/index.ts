import { NodeRegistry } from "../node-registry";
import { triggerManifest } from "./trigger";
import { filterManifest } from "./filter";
import { actionManifest } from "./action";
import { notifyManifest } from "./notify";

export { triggerManifest, filterManifest, actionManifest, notifyManifest };

export function createDefaultRegistry(): NodeRegistry {
  const registry = new NodeRegistry();
  registry.register(triggerManifest);
  registry.register(filterManifest);
  registry.register(actionManifest);
  registry.register(notifyManifest);
  return registry;
}
