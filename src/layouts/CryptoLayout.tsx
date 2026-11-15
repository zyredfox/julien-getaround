import { Outlet } from "react-router-dom";
import { SpaceSubnav } from "@/layouts/SpaceSubnav";
import { getSpaceByKind } from "@/spaces/registry";

export function CryptoLayout() {
  const space = getSpaceByKind("crypto");
  if (!space) return <Outlet />;

  return (
    <div>
      <SpaceSubnav items={space.nav} label="Navigation Crypto" />
      <Outlet />
    </div>
  );
}
