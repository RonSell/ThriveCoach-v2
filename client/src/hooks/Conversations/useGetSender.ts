import { useCallback } from 'react';
import { getResponseSender } from 'librechat-data-provider';
import type { TEndpointOption, TEndpointsConfig } from 'librechat-data-provider';
import { useGetEndpointsQuery } from '~/data-provider';

export default function useGetSender() {
  const { data: endpointsConfig = {} as TEndpointsConfig } = useGetEndpointsQuery();
  return useCallback(
    (endpointOption: TEndpointOption) => {
      const { modelDisplayLabel } = endpointsConfig?.[endpointOption.endpoint ?? ''] ?? {};
      
      // Override model display for ThriveCoach
      if (endpointOption.endpoint === 'custom' && endpointOption.model === 'gpt-4o') {
        return 'ThriveCoach';
      }
      
      return getResponseSender({ ...endpointOption, modelDisplayLabel });
    },
    [endpointsConfig],
  );
}
