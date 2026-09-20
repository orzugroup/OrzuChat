import type { Metadata } from 'next';
import { SupportPageView } from '@/components/pages/SupportPageView';
import { getDict } from '@/lib/content';
import { buildMetadata } from '@/lib/metadata';

const dict = getDict('en');

export const metadata: Metadata = buildMetadata({
  locale: 'en',
  route: 'support',
  meta: dict.support.meta,

});

export default function Page() {
  return <SupportPageView dict={dict} locale="en" />;
}
