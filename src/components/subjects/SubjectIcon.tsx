"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FA_ICON_MAP } from "@/lib/fa-icons";
import { DEFAULT_SUBJECT_ICON } from "@/lib/subject-icons";
import { cn } from "@/lib/utils";

type IconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

interface SubjectIconProps {
  name?: string;
  className?: string;
  size?: number;
}

const FA_PREFIX = "fa:";

/**
 * Renders an icon by name string.
 * - Names starting with "fa:" render a FontAwesome icon.
 * - All other names render a Lucide icon.
 * Falls back to BookOpen if the icon name is unknown or missing.
 */
export function SubjectIcon({ name, className, size }: SubjectIconProps) {
  const iconName = name || DEFAULT_SUBJECT_ICON;

  // FontAwesome icon
  if (iconName.startsWith(FA_PREFIX)) {
    const faKey = iconName.slice(FA_PREFIX.length);
    const faIcon = FA_ICON_MAP[faKey];
    if (faIcon) {
      return (
        <FontAwesomeIcon
          icon={faIcon}
          className={cn("shrink-0", className)}
          style={size ? { width: size, height: size } : undefined}
        />
      );
    }
    // FA icon not found in map, fall through to Lucide default
  }

  // Lucide icon
  const LucideIcon = (LucideIcons as unknown as Record<string, IconComponent>)[
    iconName
  ];

  if (!LucideIcon) {
    const Fallback = (LucideIcons as unknown as Record<string, IconComponent>)[
      DEFAULT_SUBJECT_ICON
    ];
    if (Fallback) {
      return <Fallback className={cn("shrink-0", className)} size={size} />;
    }
    return null;
  }

  return <LucideIcon className={cn("shrink-0", className)} size={size} />;
}
