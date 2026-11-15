import { Outlet } from "react-router-dom";
import { SpaceSubnav } from "@/layouts/SpaceSubnav";
import { getSpaceByKind } from "@/spaces/registry";

export function PeaLayout() {
  const space = getSpaceByKind("pea");
  if (!space) return <Outlet />;

  return (
    <div>
      <SpaceSubnav items={space.nav} label="Navigation PEA" />
      <Outlet />
    </div>
  );
}
