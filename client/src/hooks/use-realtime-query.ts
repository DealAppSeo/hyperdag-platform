import { useEffect } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

interface RealtimeQueryOptions<TData> extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn?: () => Promise<TData>;
  supabaseTable?: string;
  supabaseSchema?: string;
  supabaseFilter?: string;
  onRealtimeEvent?: (payload: any) => void;
}

/**
 * ✅ HYPERDAG FIX PATTERN: useRealtimeQuery
 * 
 * Replaces polling with Supabase real-time subscriptions.
 * 
 * @example
 * // ❌ BAD: Polling every 5s
 * useQuery({ queryKey: ['/api/data'], refetchInterval: 5000 });
 * 
 * // ✅ GOOD: Real-time only
 * useRealtimeQuery({
 *   queryKey: ['/api/data'],
 *   supabaseTable: 'my_table'
 * });
 */
export function useRealtimeQuery<TData = unknown>(
  options: RealtimeQueryOptions<TData>
): UseQueryResult<TData> {
  const {
    queryKey,
    queryFn,
    supabaseTable,
    supabaseSchema = 'public',
    supabaseFilter,
    onRealtimeEvent,
    ...queryOptions
  } = options;

  // Standard query WITHOUT polling
  const query = useQuery<TData>({
    queryKey,
    queryFn,
    ...queryOptions,
  });

  // ✅ REAL-TIME: Subscribe to Supabase changes
  useEffect(() => {
    if (!supabaseTable) return;

    const channelName = `${supabaseTable}-${queryKey.join('-')}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: supabaseSchema,
          table: supabaseTable,
          ...(supabaseFilter && { filter: supabaseFilter }),
        },
        (payload) => {
          // Custom handler or default invalidation
          if (onRealtimeEvent) {
            onRealtimeEvent(payload);
          } else {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryKey, supabaseTable, supabaseSchema, supabaseFilter, onRealtimeEvent]);

  return query;
}

/**
 * ✅ Helper for optimistic updates
 * 
 * Use this when you want instant UI updates on INSERT/UPDATE/DELETE
 */
export function useRealtimeQueryOptimistic<TData extends { data: any[] }>(
  options: RealtimeQueryOptions<TData>
): UseQueryResult<TData> {
  return useRealtimeQuery({
    ...options,
    onRealtimeEvent: (payload) => {
      queryClient.setQueryData<TData>(options.queryKey, (old) => {
        if (!old?.data) return old;

        const { eventType, new: newRecord, old: oldRecord } = payload;
        let updated = [...old.data];

        if (eventType === 'INSERT' && newRecord) {
          updated.push(newRecord);
        } else if (eventType === 'UPDATE' && newRecord) {
          const index = updated.findIndex((item: any) => item.id === newRecord.id);
          if (index !== -1) updated[index] = newRecord;
        } else if (eventType === 'DELETE' && oldRecord) {
          updated = updated.filter((item: any) => item.id !== oldRecord.id);
        }

        return {
          ...old,
          data: updated,
        } as TData;
      });
    },
  });
}
