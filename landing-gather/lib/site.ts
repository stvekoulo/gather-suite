export const SITE_URL = "https://gather-suite.space";
export const SITE_TITLE = "Gather: desktop planner for work and personal life";
export const SITE_DESCRIPTION =
  "Gather is a desktop planner for Windows, macOS and Linux. Keep your calendar, tasks, notes, documents, invoices and money in one app that works offline.";

export const VERSION = "0.3.2";
export const RELEASES_PAGE = "https://github.com/stvekoulo/gather-suite/releases";
const RELEASE = `${RELEASES_PAGE}/download/v${VERSION}`;

export const DOWNLOADS = {
  windows: `${RELEASE}/Gather_${VERSION}_x64-setup.exe`,
  macSilicon: `${RELEASE}/Gather_${VERSION}_aarch64.dmg`,
  macIntel: `${RELEASE}/Gather_${VERSION}_x64.dmg`,
  linuxAppImage: `${RELEASE}/Gather_${VERSION}_amd64.AppImage`,
  linuxDeb: `${RELEASE}/Gather_${VERSION}_amd64.deb`,
};
