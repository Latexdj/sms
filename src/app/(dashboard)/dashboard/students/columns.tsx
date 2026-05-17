"use client";

import { ColumnDef } from "@tanstack/react-table";
type Student = {
  id: string;
  school_id: string;
  class_id: string | null;
  admission_number: string;
  first_name: string;
  last_name: string;
  dob: Date;
  gender: string;
  parent_name: string;
  parent_phone: string;
  address: string | null;
  region: string | null;
  status: string;
  photo_url: string | null;
  enrolled_at: Date;
};
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const columns: ColumnDef<Student & { class: any }>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "student",
    header: "Student",
    cell: ({ row }) => {
      const student = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={student.photo_url || ""} alt="Avatar" />
            <AvatarFallback>{(student.first_name?.[0] || "")}{(student.last_name?.[0] || "")}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{student.first_name} {student.last_name}</span>
            <span className="text-xs text-muted-foreground">{student.admission_number}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "class",
    header: "Class",
    cell: ({ row }) => {
      const cls = row.original.class;
      return cls ? (
        <Badge variant="outline">{cls.name}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Unassigned</span>
      );
    },
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "parent_phone",
    header: "Contact",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{row.original.parent_name}</span>
        <span className="text-xs text-muted-foreground">{row.original.parent_phone}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, string> = {
        ACTIVE: "default",
        GRADUATED: "secondary",
        TRANSFERRED: "outline",
        DISMISSED: "destructive",
      };
      return <Badge variant={variants[status] as any || "default"}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original;

      return (
        <DropdownMenu>
          {/* @ts-expect-error - Radix Trigger polymorphic type error */}
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(student.admission_number)}>
              Copy Admission ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Edit Student</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Dismiss</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
