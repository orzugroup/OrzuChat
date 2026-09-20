import type { Metadata } from 'next';
import { HomePage } from '@/components/pages/HomePage';
import { getDict } from '@/lib/content';
import { buildMetadata } from '@/lib/metadata';

const dict = getDict('en');

export const metadata: Metadata = buildMetadata({
  locale: 'en',
  route: 'home',
  meta: dict.home.meta,
});

export default function Page() {
  return <HomePage dict={dict} locale="en" />;
}
