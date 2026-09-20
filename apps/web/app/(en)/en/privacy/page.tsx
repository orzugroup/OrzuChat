import type { Metadata } from 'next';
import { LegalPage } from '@/components/pages/LegalPage';
import { getDict } from '@/lib/content';
import { buildMetadata } from '@/lib/metadata';

const dict = getDict('en');

export const metadata: Metadata = buildMetadata({
  locale: 'en',
  route: 'privacy',
  meta: dict.privacy.meta,
});

export default function Page() {
  return <LegalPage dict={dict} locale="en" route="privacy" article={dict.privacy} />;
}
