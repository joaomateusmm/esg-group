"use client";

import { addDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale"; // Para deixar em português
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // O utilitário padrão do shadcn

interface BookingDatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  title?: string;
}

export function BookingDatePicker({
  date,
  setDate,
  title = "Escolher data",
}: BookingDatePickerProps) {
  // Calcula o dia atual (zerando as horas para evitar bugs de fuso horário)
  const today = startOfDay(new Date());

  // Calcula a data mínima permitida (hoje + 10 dias)
  const minDate = addDays(today, 10);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "text-md mt-1 h-12 w-full cursor-pointer bg-blue-500 font-bold text-white hover:bg-blue-600 hover:text-white",
            !date && "text-white",
          )}
        >
          {date ? format(date, "PPP", { locale: ptBR }) : <span>{title}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={ptBR}
          disabled={(currentDate) => currentDate < minDate}
        />
      </PopoverContent>
    </Popover>
  );
}
