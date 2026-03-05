"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, LayoutList, BookOpen, Plus, CalendarCheck, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { isToday, format, addDays, isBefore, startOfDay } from 'date-fns';
import logoImg from '@/assets/icon-spacelinear.png';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { useMemo } from 'react';
import { DIFFICULTY_CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { CreateTopicModal } from '@/components/topics/CreateTopicModal';

export function Sidebar() {
  const { subjects, topics, sidebarCollapsed, toggleSidebar } = useStore();
  const { user } = useAuth();
  const pathname = usePathname();
  const [showCreateTopic, setShowCreateTopic] = useState(false);


  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  // Group topics by date for schedule (next 7 days)
  const scheduleGroups = useMemo(() => {
    const today = startOfDay(new Date());
    const limit = addDays(today, 7);

    type ScheduleTopic = (typeof topics)[number] & { isOverdue: boolean };

    const upcoming: ScheduleTopic[] = topics
      .filter((t) => {
        const d = startOfDay(new Date(t.nextReviewDate));
        return isBefore(d, limit) || d.getTime() === limit.getTime();
      })
      .map((t) => {
        const d = startOfDay(new Date(t.nextReviewDate));
        const isOverdue = isBefore(d, today);
        return { ...t, isOverdue };
      })
      .sort(
        (a, b) =>
          new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
      );

    const groups: { label: string; topics: ScheduleTopic[] }[] = [];
    const map = new Map<string, ScheduleTopic[]>();

    for (const topic of upcoming) {
      const d = startOfDay(new Date(topic.nextReviewDate));
      const key =
        isToday(d) || isBefore(d, today) ? "Today's Topic" : format(d, 'd MMMM');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(topic);
    }

    for (const [label, items] of map) {
      groups.push({ label, topics: items });
    }

    return groups;
  }, [topics]);

  const navItems = [
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/pulse', label: 'Pulse', icon: BarChart3 },
  { to: '/topics', label: 'All Topics', icon: LayoutList }];


  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-sidebar h-screen transition-all duration-200 flex-shrink-0',
        sidebarCollapsed ? 'w-12 items-center' : 'w-[244px]'
      )}>
      
      {/* === Header === */}
      <div className={cn(
        'flex items-center pt-4 pb-2',
        sidebarCollapsed ? 'px-2 flex-col gap-2' : 'px-4 justify-between'
      )}>
        <img src={typeof logoImg === 'string' ? logoImg : logoImg.src} alt="SpaceLinear" className="w-[34px] h-[34px] rounded" />
        {sidebarCollapsed ?
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          
            <ChevronRight className="w-4 h-4" />
          </button> :

        <div className="flex items-center gap-2.5">
            <button
            onClick={() => setShowCreateTopic(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            
              <Plus className="w-4 h-4" />
            </button>
            <button
            onClick={toggleSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        }
      </div>

      {/* === Content (nav + schedule) === */}
      <ScrollArea className={cn('flex-1', sidebarCollapsed ? 'px-2' : 'px-4')}>
        <div className="flex flex-col gap-2.5 py-2">
          {/* Nav items */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    'flex items-center px-2 py-1.5 rounded-md text-sm transition-colors',
                    sidebarCollapsed ? 'justify-center' : 'gap-2.5',
                    active ?
                    'bg-accent text-foreground font-medium' :
                    'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                  )}>
                  
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <AnimatePresence>
                    {!sidebarCollapsed &&
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.15 }}>
                      
                        {item.label}
                      </motion.span>
                    }
                  </AnimatePresence>
                </Link>);

            })}

            {/* Subjects nav item */}
            <Link
              href="/subjects"
              className={cn(
                'flex items-center px-2 py-1.5 rounded-md text-sm transition-colors',
                sidebarCollapsed ? 'justify-center' : 'gap-2.5',
                pathname === '/subjects' || pathname.startsWith('/subjects/') ?
                'bg-accent text-foreground font-medium' :
                'text-sidebar-foreground hover:bg-accent hover:text-foreground'
              )}>
              
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed &&
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}>
                  
                    Subjects
                  </motion.span>
                }
              </AnimatePresence>
            </Link>
          </nav>

          {/* Schedule section */}
          <AnimatePresence>
          {!sidebarCollapsed &&
            <motion.div
              className="flex flex-col gap-4 mt-6"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}>
              
              {/* Date groups */}
              <div className="flex flex-col gap-3">
                {scheduleGroups.length === 0 &&
                <p className="px-2 text-xs text-muted-foreground">No upcoming reviews</p>
                }
                {scheduleGroups.map((group) =>
                <div key={group.label} className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between px-0 pr-[4px]">
                      <span className="text-sm font-medium text-foreground">{group.label}</span>
                      {group.label === "Today's Topic" &&
                    <Link href="/today" className="w-5 h-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Play className="w-3 h-3" />
                        </Link>
                    }
                    </div>
                    <div className="flex-col flex items-start justify-start gap-[6px] px-0">
                      {group.topics.map((topic) => {
                      const subject = subjects.find((s) => s.id === topic.subjectId);
                      const diffConfig = topic.currentDifficulty ? DIFFICULTY_CONFIG[topic.currentDifficulty] : null;
                      return (
                        <HoverCard key={topic.id} openDelay={300} closeDelay={100}>
                              <HoverCardTrigger asChild>
                              <Link
                              href={`/topics/${topic.id}`}
                              className="text-sm text-sidebar-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors truncate text-left w-full mx-0 my-0 px-[6px] py-[4px] block">
                              
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate">{topic.title}</span>
                                  {group.label === "Today's Topic" && topic.isOverdue && (
                                    <Badge
                                      variant="outline"
                                      className="shrink-0 h-4 text-[10px] px-1.5 py-0 border-[#c81e1e] text-destructive font-normal"
                                    >
                                      Due
                                    </Badge>
                                  )}
                                </div>
                              </Link>
                            </HoverCardTrigger>
                            <HoverCardContent side="right" align="start" className="w-52 p-3 space-y-2">
                              {subject &&
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>{subject.icon}</span>
                                  <span className="truncate">{subject.name}</span>
                                </div>
                            }
                              <p className="text-sm font-medium text-foreground truncate">{topic.title}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground capitalize">{topic.state}</span>
                                {diffConfig &&
                              <span className={`text-xs font-medium text-${diffConfig.color}`}>
                                    {diffConfig.label}
                                  </span>
                              }
                              </div>
                            </HoverCardContent>
                          </HoverCard>);

                    })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            }
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* === Footer === */}
      <div className={cn('border-t border-border py-3', sidebarCollapsed ? 'px-2' : 'px-4')}>
        {!sidebarCollapsed ?
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md hover:bg-accent transition-colors p-1">
          
            <Avatar className="w-[34px] h-[34px]">
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm text-foreground truncate">{displayName}</span>
              <span className="text-[10px] text-muted-foreground">Free</span>
            </div>
          </Link> :

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-1 rounded-md hover:bg-accent transition-colors">
          
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      </div>
      <AnimatePresence>
        {showCreateTopic && <CreateTopicModal onClose={() => setShowCreateTopic(false)} />}
      </AnimatePresence>
    </aside>);

}