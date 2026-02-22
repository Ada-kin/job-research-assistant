'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewApplicationDetailPage } from '@/components/new-ui/application-detail-page';
import { isNewUiEnabledClient } from '@/lib/feature-flags';

export default function ApplicationDetailRoute({ params }: { params: any }) {
  const id = params?.id ?? "";
  const router = useRouter();

  useEffect(() => {
    if (!isNewUiEnabledClient()) {
      router.replace('/applications');
    }
  }, [router]);

  if (!isNewUiEnabledClient()) {
    return null;
  }

  return <NewApplicationDetailPage id={id} />;
}
