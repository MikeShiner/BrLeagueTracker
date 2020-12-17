import { Component, OnInit } from "@angular/core";

declare interface RouteInfo {
  path: string;
  title: string;
  rtlTitle?: string;
  icon: string;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  {
    path: "/register",
    title: "Register",
    icon: "icon-pencil",
    class: "",
  },
  {
    path: "/leaderboards",
    title: "Leaderboards",
    icon: "icon-trophy",
    class: "",
  },
  {
    path: "/scoreboards",
    title: "Scoreboards",
    icon: "icon-chart-bar-32",
    class: "",
  },
  {
    path: "/rules",
    title: "Rules",
    icon: "icon-paper",
    class: "",
  },
];

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.css"],
})
export class SidebarComponent implements OnInit {
  menuItems: any[];

  constructor() {}

  ngOnInit() {
    this.menuItems = ROUTES.filter((menuItem) => menuItem);
  }
  isMobileMenu() {
    if (window.innerWidth > 991) {
      return false;
    }
    return true;
  }
}
