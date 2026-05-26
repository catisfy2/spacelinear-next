import { useState } from "react";
import {
  Grid3X3,
  List,
  ArrowUpDown,
  FolderPlus,
  Link as LinkIcon,
  FileText,
  Upload,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { BreadcrumbNav } from "./BreadcrumbNav";
import type { Material } from "@/lib/types";

export type ViewMode = "grid" | "list";
export type SortField = "name" | "updated_at" | "type" | "file_size";

interface MaterialsToolbarProps {
  crumbs: Material[];
  viewMode: ViewMode;
  sortField: SortField;
  sortAsc: boolean;
  searchQuery: string;
  onNavigate: (folderId: string | null) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (field: SortField) => void;
  onSortDirToggle: () => void;
  onSearchChange: (query: string) => void;
  onCreateFolder: () => void;
  onUploadFile: () => void;
  onAddLink: () => void;
  onAddText: () => void;
}

export function MaterialsToolbar({
  crumbs,
  viewMode,
  sortField,
  sortAsc,
  searchQuery,
  onNavigate,
  onViewModeChange,
  onSortChange,
  onSortDirToggle,
  onSearchChange,
  onCreateFolder,
  onUploadFile,
  onAddLink,
  onAddText,
}: MaterialsToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Breadcrumb + actions row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbNav crumbs={crumbs} onNavigate={onNavigate} />

        <div className="flex items-center gap-1.5">
          {/* New button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="rounded-lg">
                <Upload className="mr-1.5 h-3.5 w-3.5" /> New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onCreateFolder}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUploadFile}>
                <Upload className="mr-2 h-4 w-4" />
                File Upload
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddLink}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddText}>
                <FileText className="mr-2 h-4 w-4" />
                Text Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border">
            <Button
              variant="ghost"
              size="sm"
              className={viewMode === "grid" ? "bg-accent" : ""}
              onClick={() => onViewModeChange("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={viewMode === "list" ? "bg-accent" : ""}
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-lg">
                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuRadioGroup
                value={sortField}
                onValueChange={(v) => onSortChange(v as SortField)}
              >
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="updated_at">Date modified</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="type">Type</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="file_size">Size</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSortDirToggle}>
                {sortAsc ? "Ascending" : "Descending"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
    </div>
  );
}
