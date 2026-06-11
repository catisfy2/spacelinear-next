"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail } from "lucide-react";
import type { TeamMember } from "@/lib/docs-utils";

interface TeamSectionProps {
  teamMembers: TeamMember[];
}

export function TeamSection({ teamMembers }: TeamSectionProps) {
  return (
    <section
      id="section-team"
      className="mb-16 scroll-mt-20 border-b border-border/50 pb-16"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
        Pitch
      </p>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        Team & Contributors
      </h2>
      <p className="mb-8 text-muted-foreground">
        The people building SpaceLinear
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <TeamCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const initials = member.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0 rounded-full border-2 border-border">
          {member.avatar_url ? (
            <AvatarImage
              src={member.avatar_url}
              alt={member.full_name}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">
            {member.full_name}
          </h3>
          <p className="text-sm text-muted-foreground">{member.role}</p>
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-primary"
            >
              <Mail className="h-3 w-3" />
              {member.email}
            </a>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground/80">
          {member.bio}
        </p>
      )}
    </div>
  );
}
