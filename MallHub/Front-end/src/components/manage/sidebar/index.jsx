import { Calendar, Diamond, Gift, Inbox, Search, Settings, Tag } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "react-router"
import { ROLES_ENUM } from "@/lib/constants"
import { useAuth } from "@/providers/auth-provider"

// Menu items.
const items = [

  {
    title: "Categories",
    url: "/manage/categories",
    icon: Inbox,
    roles: [ROLES_ENUM.ADMIN]
  },
  {
    title: "Sections",
    url: "/manage/sections",
    icon: Search,
    roles: [ROLES_ENUM.ADMIN]
  },
  {
    title: "Discount Codes",
    url: "/manage/discount-codes",
    icon: Tag,
    roles: [ROLES_ENUM.ADMIN]
  },
  {
    title: "Loyalty Diamonds",
    url: "/manage/loyalty/diamonds",
    icon: Diamond,
    roles: [ROLES_ENUM.ADMIN]
  },
  {
    title: "Loyalty Prizes",
    url: "/manage/loyalty/prizes",
    icon: Gift,
    roles: [ROLES_ENUM.ADMIN]
  },
  {
    title: "Stores",
    url: "/manage/stores",
    icon: Settings,
    roles: [ROLES_ENUM.STORE_MANAGER]
  },
  {
    title: "Products",
    url: "/manage/products",
    icon: Calendar,
    roles: [ROLES_ENUM.STORE_MANAGER]
  },
]

export function AdminSidebar() {

  const { role } = useAuth();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter(src => src?.roles?.includes(role)).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
