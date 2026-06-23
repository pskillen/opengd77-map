import ExportFromActivePanel from '../components/ExportFromActivePanel/ExportFromActivePanel.tsx';
import ImportIntoActivePanel from '../components/ImportIntoActivePanel/ImportIntoActivePanel.tsx';
import { Page, PageHeader, PageSection, PageSectionGrid } from '../components/ui/index.ts';
import { useVendorFormatParam } from '../hooks/useVendorFormatParam.ts';

export default function ImportExport() {
  const { vendorFormat } = useVendorFormatParam();

  return (
    <Page>
      <PageHeader
        title="Import & export"
        description={
          <>
            Your codeplug is vendor-neutral inside the app. Choose the interchange format in the
            sidebar — where files came from for import, or where you want to send them for export.
            OpenGD77 CPS CSV and CHIRP CSV are supported today; qDMR YAML, native YAML, Baofeng
            DM-32 CPS, and others are planned.
          </>
        }
      />

      <PageSectionGrid>
        <PageSection
          title="Import"
          description="Add or refresh data in the active codeplug without creating a new project."
        >
          <ImportIntoActivePanel key={vendorFormat.id} vendorFormat={vendorFormat} />
        </PageSection>

        <PageSection title="Export" description="Download the active codeplug as vendor CPS files.">
          <ExportFromActivePanel vendorFormat={vendorFormat} />
        </PageSection>
      </PageSectionGrid>
    </Page>
  );
}
