import { useQuery } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeftCircle,
  Edit,
  FileQuestion,
  Siren,
} from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '~/components/layout/EmptyState';
import { LoadingScreen } from '~/components/layout/LoadingScreen';
import { FormSection, FormValueRow } from '~/components/ui/Form';
import { db } from '~/db/db';
import {
  procedureTable,
  procedureSpecialTable,
  medicalCaseTable,
} from '~/db/schema';

export default function ShowProcedure() {
  const intl = useIntl();
  const router = useRouter();

  const { procedureId: procedureIdParam } = useLocalSearchParams<{
    procedureId: string;
  }>();
  const procedureId = parseInt(procedureIdParam, 10);

  const { data, isPending } = useQuery({
    queryKey: ['procedure', procedureId],
    queryFn: async () => {
      const items = await db
        .select({
          procedure: procedureTable,
          medicalCase: medicalCaseTable,
        })
        .from(procedureTable)
        .innerJoin(
          medicalCaseTable,
          eq(procedureTable.caseNumber, medicalCaseTable.caseNumber),
        )
        .where(eq(procedureTable.id, procedureId));
      const item = items[0];
      if (!item)
        return { procedure: undefined, medicalCase: undefined, specials: [] };
      const specials = await db
        .select()
        .from(procedureSpecialTable)
        .where(eq(procedureSpecialTable.procedureId, item.procedure.id));
      return {
        procedure: item.procedure,
        medicalCase: item.medicalCase,
        specials: specials.map((s) => s.special),
      };
    },
  });

  const yesNo = (value: boolean) =>
    value
      ? intl.formatMessage({ id: 'common.yes' })
      : intl.formatMessage({ id: 'common.no' });

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!data || !data.procedure || !data.medicalCase) {
    return (
      <EmptyState
        icon={FileQuestion}
        title={intl.formatMessage({ id: 'procedure.not-found.title' })}
        message={intl.formatMessage({ id: 'procedure.not-found.message' })}
        actionLabel={intl.formatMessage({ id: 'common.go-back' })}
        onAction={() => router.back()}
      />
    );
  }

  const { procedure, medicalCase, specials } = data;

  return (
    <SafeAreaView
      edges={['bottom']}
      className="flex-1 bg-background-primary-light dark:bg-background-primary-dark"
    >
      <Stack.Screen
        options={{
          title: procedure.caseNumber,
          presentation: 'modal',
          headerLeft: () => (
            <PressableScale
              className="px-2"
              onPress={() => {
                router.back();
              }}
            >
              <ChevronLeftCircle
                size={24}
                className="color-black dark:color-white"
              />
            </PressableScale>
          ),
          headerRight: () => (
            <PressableScale
              className="px-2"
              onPress={() => {
                router.push(`/procedure/${procedureId}/edit`);
              }}
            >
              <Edit size={24} className="color-black dark:color-white" />
            </PressableScale>
          ),
        }}
      />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {procedure.emergency && (
          <View className="mb-6 flex-row items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3">
            <Siren size={20} color="#FFFFFF" />
            <Text className="text-base font-semibold text-white">
              {intl.formatMessage({ id: 'procedure.emergency-banner' })}
            </Text>
          </View>
        )}
        <FormSection
          title={intl.formatMessage({ id: 'procedure.form.section.case-info' })}
        >
          <FormValueRow
            label={intl.formatMessage({ id: 'procedure.form.case-number' })}
            value={procedure.caseNumber}
          />
          <FormValueRow
            label={intl.formatMessage({ id: 'procedure.form.favorite' })}
            value={yesNo(medicalCase.favorite)}
          />
        </FormSection>
        <FormSection
          title={intl.formatMessage({
            id: 'procedure.form.section.patient-info',
          })}
        >
          <FormValueRow
            label={intl.formatMessage({ id: 'procedure.form.years' })}
            value={`${procedure.ageYears}`}
          />
          <FormValueRow
            label={intl.formatMessage({ id: 'procedure.form.months' })}
            value={`${procedure.ageMonths}`}
          />
        </FormSection>
        <FormSection
          title={intl.formatMessage({
            id: 'procedure.form.section.operation-info',
          })}
        >
          <FormValueRow
            label={intl.formatMessage({ id: 'procedure.form.operation-date' })}
            value={intl.formatDate(procedure.date, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
          <FormValueRow
            label={intl.formatMessage({ id: 'procedure.form.asa-score' })}
            value={`ASA ${procedure.asaScore}`}
          />
          <FormValueRow
            label={intl.formatMessage({
              id: 'procedure.form.airway-management',
            })}
            value={intl.formatMessage({
              id: `enum.airway-management.${procedure.airwayManagement}`,
            })}
          />
          <FormValueRow
            label={intl.formatMessage({ id: 'procedure.form.department' })}
            value={intl.formatMessage({
              id: `enum.department.${procedure.department}`,
            })}
          />
          <FormValueRow
            label={intl.formatMessage({
              id: 'procedure.form.local-anesthetics',
            })}
            value={yesNo(procedure.localAnesthetics)}
          />
          {procedure.localAnestheticsText ? (
            <View className="px-4 py-3">
              <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
                {procedure.localAnestheticsText}
              </Text>
            </View>
          ) : null}
          <FormValueRow
            label={intl.formatMessage({ id: 'procedure.form.emergency' })}
            value={yesNo(procedure.emergency)}
          />
        </FormSection>
        {specials && specials.length > 0 && (
          <FormSection
            title={intl.formatMessage({
              id: 'procedure.form.section.specials',
            })}
          >
            <View className="px-4 py-3">
              <Text className="text-base text-text-primary-light dark:text-text-primary-dark">
                {specials
                  .map((special) =>
                    intl.formatMessage({ id: `enum.specials.${special}` }),
                  )
                  .sort((a, b) => a.localeCompare(b))
                  .join(', ')}
              </Text>
            </View>
          </FormSection>
        )}
        {procedure.description ? (
          <FormSection
            title={intl.formatMessage({ id: 'procedure.form.procedure' })}
          >
            <View className="px-4 py-3">
              <Text className="text-base leading-6 text-text-primary-light dark:text-text-primary-dark">
                {procedure.description}
              </Text>
            </View>
          </FormSection>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
