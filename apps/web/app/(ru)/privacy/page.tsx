import type { Metadata } from 'next';
import { LegalPage } from '@/components/pages/LegalPage';
import { getDict } from '@/lib/content';
import { buildMetadata } from '@/lib/metadata';

const dict = getDict('ru');

export const metadata: Metadata = buildMetadata({
  locale: 'ru',
  route: 'privacy',
  meta: dict.privacy.meta,
});

export default function Page() {
  return <LegalPage dict={dict} locale="ru" route="privacy" article={dict.privacy} />;
}
