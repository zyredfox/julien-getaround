import { Outlet } from "react-router-dom";
import { SpaceSubnav } from "@/layouts/SpaceSubnav";
import { getSpaceByKind } from "@/spaces/registry";

export function GetaroundLayout() {
  const space = getSpaceByKind("getaround");
  if (!space) return <Outlet />;

  return (
    <div>
      <SpaceSubnav items={space.nav} label="Navigation Getaround" />
      <Outlet />
    </div>
  );
}
