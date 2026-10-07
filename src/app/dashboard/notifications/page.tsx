import { Metadata } from "next";
import NotificationsPageClient from "./NotificationsPageClient";

export const metadata: Metadata = {
  title: "Notifications - Manageo",
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
