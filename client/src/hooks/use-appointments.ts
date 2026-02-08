import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type Appointment, type InsertAppointment } from "@shared/routes";
import { z } from "zod";

export function useAppointments(filters?: { startDate?: string; endDate?: string; professionalId?: string }) {
  const queryString = filters ? new URLSearchParams(filters as any).toString() : "";
  const queryKey = [api.appointments.list.path, queryString];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `${api.appointments.list.path}?${queryString}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return api.appointments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAppointment) => {
      // Need to transform numeric fields from string forms if necessary, but zod should handle coerce in backend
      // Just sending raw data, let backend validate/coerce
      const res = await fetch(api.appointments.create.path, {
        method: api.appointments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || "Failed to create appointment");
      }
      return api.appointments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "pending" | "confirmed" | "rejected" }) => {
      const url = buildUrl(api.appointments.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.appointments.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.appointments.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}
