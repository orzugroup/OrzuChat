import type { Metadata } from 'next';
import { SecurityPageView } from '@/components/pages/SecurityPageView';
import { getDict } from '@/lib/content';
import { buildMetadata } from '@/lib/metadata';

const dict = getDict('ru');

export const metadata: Metadata = buildMetadata({
  locale: 'ru',
  route: 'security',
  meta: dict.securityPage.meta,

});

export default function Page() {
  return <SecurityPageView dict={dict} locale="ru" />;
}
