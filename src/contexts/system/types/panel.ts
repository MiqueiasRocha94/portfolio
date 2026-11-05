export type SpecialPanelId = "menu" ;

export type SpecialPanelState = {
  activeItemId: string | null;
  isOpen: boolean;
  label: string;
  view: string;
};
