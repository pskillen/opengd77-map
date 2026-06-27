import ExportFromActivePanel from '../components/ExportFromActivePanel/ExportFromActivePanel.tsx';
import ImportIntoActivePanel from '../components/ImportIntoActivePanel/ImportIntoActivePanel.tsx';
import { HelpAlert } from '../components/help/index.ts';
import { Page, PageHeader, PageSection, PageSectionGrid } from '../components/ui/index.ts';
import { useVendorFormatParam } from '../hooks/useVendorFormatParam.ts';

export default function ImportExport() {
  const { vendorFormat } = useVendorFormatParam();

  return (
    <Page>
      <PageHeader
        title="Import & export"
        description="Merge into your active project or download CPS files for your radio."
      />
      <HelpAlert helpId="importExport.overview" />

      <PageSectionGrid>
        <PageSection title="Import" description="Add or refresh data in the active codeplug.">
          <HelpAlert helpId="importExport.mergeVsOverwrite" color="gray" />
          <ImportIntoActivePanel key={vendorFormat.id} vendorFormat={vendorFormat} />
        </PageSection>

        <PageSection title="Export" description="Download for your chosen radio format.">
          <HelpAlert helpId="importExport.oneProjectManyFormats" color="gray" />
          <ExportFromActivePanel vendorFormat={vendorFormat} />
        </PageSection>
      </PageSectionGrid>
    </Page>
  );
}
