import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertRecording, type Recording } from "@shared/schema";

// Helper to validate and parse response
// In a real app we'd use the Zod schema from api.recordings.list.responses[200]
// but for now we'll trust the backend response shape based on the manifest.

export function useAllRecordings() {
  return useQuery({
    queryKey: ["/api/all-recordings"],
    queryFn: async () => {
      const res = await fetch("/api/all-recordings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch all recordings");
      return await res.json() as (Recording & { user: any, feedback: any[] })[];
    },
  });
}

export function useRecordings() {
  return useQuery({
    queryKey: [api.recordings.list.path],
    queryFn: async () => {
      const res = await fetch(api.recordings.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recordings");
      return await res.json() as (Recording & { feedback?: any[] })[];
    },
  });
}

export function usePendingRecordings() {
  return useQuery({
    queryKey: [api.recordings.listPending.path],
    queryFn: async () => {
      const res = await fetch(api.recordings.listPending.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending recordings");
      return await res.json() as Recording[];
    },
  });
}

export function useRecording(id: number) {
  return useQuery({
    queryKey: [api.recordings.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.recordings.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recording details");
      return await res.json() as Recording & { user: any, feedback: any[] };
    },
    enabled: !!id,
  });
}

export function useCreateRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRecording & { rerecordOf?: number }) => {
      const res = await fetch(api.recordings.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit recording");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recordings.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.recordings.listPending.path] });
    },
  });
}
