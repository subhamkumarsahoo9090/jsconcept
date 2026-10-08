import type { Metadata } from "next";
import ProfileView from "@/components/profile/ProfileView";
import { pageMetadata } from "@/config/projectmanager";

export const metadata: Metadata = pageMetadata("/profile");

export default function ProfilePage() {
  return <ProfileView />;
}
