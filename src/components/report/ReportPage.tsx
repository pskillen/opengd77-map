import type { ReactNode } from 'react';
import Page from '../ui/Page.tsx';
import PageHeader from '../ui/PageHeader.tsx';

export interface ReportPageProps {
  title: string;
  children: ReactNode;
  description?: ReactNode;
}

/** @deprecated Use `Page` + `PageHeader` from `src/components/ui/` */
export default function ReportPage({ title, description, children }: ReportPageProps) {
  return (
    <Page>
      <PageHeader title={title} description={description} />
      {children}
    </Page>
  );
}
