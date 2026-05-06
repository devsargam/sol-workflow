import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Dolphinflow",
    },
    links: [
      {
        type: "main",
        text: "Workflows",
        url: "/dashboard/workflows",
      },
      {
        type: "button",
        text: "Open App",
        url: "/",
      },
    ],
    themeSwitch: {
      enabled: false,
    },
  };
}
