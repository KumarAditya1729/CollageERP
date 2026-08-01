import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/hooks/useAccess";
import { inventoryService } from "@/lib/inventory/inventoryService";

export function useInventoryCategories() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["inv_categories", tenant?.id],
    queryFn: () => inventoryService.getCategories(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useInventoryItems() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["inv_items", tenant?.id],
    queryFn: () => inventoryService.getItems(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useInventoryLocations() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["inv_locations", tenant?.id],
    queryFn: () => inventoryService.getLocations(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useInventoryStock() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["inv_stock", tenant?.id],
    queryFn: () => inventoryService.getStock(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useInventoryMovements() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["inv_movements", tenant?.id],
    queryFn: () => inventoryService.getMovements(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateInventoryMovement() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: (movement: Record<string, unknown>) =>
      inventoryService.createMovement({ ...movement, tenant_id: tenant?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inv_movements", tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ["inv_stock", tenant?.id] });
    },
  });
}
