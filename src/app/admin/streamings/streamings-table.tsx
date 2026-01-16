"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deleteStreaming } from "./actions";
import { StreamingActions } from "./streaming-actions";

interface StreamingData {
  id: string;
  name: string;
  createdAt: Date | null;
}

export function StreamingsTable({ data }: { data: StreamingData[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredData = data.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelectAll = (checked: boolean) =>
    checked
      ? setSelectedIds(filteredData.map((s) => s.id))
      : setSelectedIds([]);
  const handleSelectOne = (checked: boolean, id: string) =>
    checked
      ? setSelectedIds((prev) => [...prev, id])
      : setSelectedIds((prev) => prev.filter((i) => i !== id));

  const handleBulkDelete = () => {
    startTransition(async () => {
      try {
        await Promise.all(selectedIds.map((id) => deleteStreaming(id)));
        setSelectedIds([]);
        toast.success("Streamings excluídos.");
      } catch {
        toast.error("Erro ao excluir.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Excluir ({selectedIds.length})
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-md border border-white/10 bg-[#0A0A0A]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-[40px]">
                <Checkbox
                  className="border-white/50 data-[state=checked]:bg-[#D00000]"
                  checked={
                    filteredData.length > 0 &&
                    selectedIds.length === filteredData.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead className="text-neutral-400">Nome</TableHead>
              <TableHead className="text-right text-neutral-400">
                Criado em
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-96 text-center text-neutral-500"
                >
                  <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-10">
                    <Image
                      src="/images/illustration.svg"
                      alt="Sem produtos"
                      width={300}
                      height={300}
                      className="opacity-40 grayscale"
                    />

                    <p className="text-lg font-light text-neutral-400">
                      Nenhum streaming encontrado.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell>
                    <Checkbox
                      className="border-white/50 data-[state=checked]:bg-[#D00000]"
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(c) => handleSelectOne(!!c, item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right text-neutral-400">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <StreamingActions id={item.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
