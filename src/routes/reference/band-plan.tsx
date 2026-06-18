import { Alert, Anchor, Stack, Text } from '@mantine/core';
import BandPlanTable from '../../components/reference/BandPlanTable.tsx';
import ReportPage from '../../components/report/ReportPage.tsx';

const RSGB_BAND_PLAN_URL =
  'https://rsgb.services/public/bandplans/docs/240205_rsgb_band_plan_2024.pdf';

export default function BandPlan() {
  return (
    <ReportPage title="Band plan">
      <Stack gap="lg">
        <Text c="dimmed">
          UK Ofcom licence allocation ranges (not RSGB sub-band usage segments). Source:{' '}
          <Anchor href={RSGB_BAND_PLAN_URL} target="_blank" rel="noopener noreferrer">
            RSGB Band Plan (effective 1 Jan 2024)
          </Anchor>
          .
        </Text>
        <BandPlanTable />
        <Alert color="gray" variant="light">
          For programming convenience only. Not authoritative for on-air operation. Licence
          class, power, and geographic restrictions apply.
        </Alert>
      </Stack>
    </ReportPage>
  );
}
