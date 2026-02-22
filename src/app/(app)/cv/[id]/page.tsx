'use client';

import { NewCvEditorPage } from '@/components/new-ui/cv-editor-page';
import { isNewUiEnabledClient } from '@/lib/feature-flags';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CvEditorRoute({ params }: { params: any }) {
  const id = params?.id ?? "";
  const router = useRouter();

  useEffect(() => {
    if (!isNewUiEnabledClient()) {
      router.replace('/cv');
    }
  }, [router]);

  if (!isNewUiEnabledClient()) {
    return null;
  }

  return <NewCvEditorPage id={id} />;
}
