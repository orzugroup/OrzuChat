import type { Metadata } from 'next';
import { DownloadPageView } from '@/components/pages/DownloadPageView';
import { getDict } from '@/lib/content';
import { buildMetadata } from '@/lib/metadata';

const dict = getDict('en');

export const metadata: Metadata = buildMetadata({
  locale: 'en',
  route: 'download',
  meta: dict.download.meta,
});

export default function Page() {
  return <DownloadPageView dict={dict} locale="en" />;
}
