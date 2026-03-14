import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Code2,
    FolderGit2,
    KeyRound,
    LayoutGrid,
    FolderKanban,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import { dashboard } from '@/routes';
import { index as apiKeysIndex } from '@/routes/api-keys';
import { index as developersIndex } from '@/routes/developers';
import { quickstart as docsQuickstart } from '@/routes/docs';
import { index as projectsIndex } from '@/routes/projects';

const REPOSITORY_URL = 'https://github.com/tortolero-ruben/poofmq';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Projects',
        href: projectsIndex(),
        icon: FolderKanban,
    },
    {
        title: 'API Keys',
        href: apiKeysIndex(),
        icon: KeyRound,
    },
    {
        title: 'Developers',
        href: developersIndex(),
        icon: Code2,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: REPOSITORY_URL,
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: docsQuickstart.url(),
        icon: BookOpen,
    },
];

export function AppSidebar() {
    usePage();
    const mainItems = mainNavItems;
    const footerItems = footerNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
