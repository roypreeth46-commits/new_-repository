import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, TrendingUp, Settings, Heart } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Chat with Emma",
    url: createPageUrl("Chat"),
    icon: MessageCircle,
  },
  {
    title: "Mood Dashboard", 
    url: createPageUrl("Dashboard"),
    icon: TrendingUp,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
 