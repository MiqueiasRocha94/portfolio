"use client";

import { useSystemContext } from "@/contexts/SystemContext";
import { Sidebar } from "@/components/sidebar";

export function RightSidebar({
  className,
}: {
  className?: string;
}) {
  const {
    closePanel,
    rightSidebarDisplayMode,
    layout,
    rightSidebarLayoutMode,
    rightSidebarReserveSpace,
    rightSidebarWidth,
    sidebarCardMargin,
  } = useSystemContext();

  return (
    <Sidebar
      className={className}
      displayMode={rightSidebarDisplayMode}
      layoutMode={rightSidebarLayoutMode}
      margin={sidebarCardMargin}
      reserveSpace={rightSidebarReserveSpace}
      side="right"
      visible={layout.rightSidebar}
      width={rightSidebarWidth}
    >
    </Sidebar>
  );
}
