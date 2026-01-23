import {
  Form,
  Host,
  LabeledContent,
  Section,
  Text as SwiftText,
} from '@expo/ui/swift-ui';
import {
  listRowBackground,
  scrollContentBackground,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useQuery } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeftCircle, Edit, FileQuestion, Siren } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '~/components/layout/EmptyState';
import { LoadingScreen } from '~/components/layout/LoadingScreen';
import { db } from '~/db/db';
import {
  procedureTable,
  procedureSpecialTable,
  medicalCaseTable,
} from '~/db/schema';
export default function ShowProcedure() {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const rowBackground = colorScheme === 'dark' ? '#1E293B' : '#f3f4f6';

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

  const getTranslatedAirwayManagement = (airway: string) => {
    return intl.formatMessage({ id: `enum.airway-management.${airway}` });
  };

  const getTranslatedDepartment = (department: string) => {
    return intl.formatMessage({ id: `enum.department.${department}` });
  };

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
      {procedure.emergency && (
        <View className="mx-4 mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-red-100 px-4 py-3 dark:bg-red-900">
          <Siren size={20} className="color-red-600 dark:color-red-300" />
          <Text className="text-base font-semibold text-red-600 dark:text-red-300">
            Notfall
          </Text>
        </View>
      )}
      <Host style={{ flex: 1 }}>
        <Form
          modifiers={[
            scrollContentBackground('hidden'),
            tint('#3B82F6'),
          ]}
        >
          <Section
            title={intl.formatMessage({
              id: 'procedure.form.section.case-info',
            })}
            modifiers={[listRowBackground(rowBackground)]}
          >
            <LabeledContent
              label={intl.formatMessage({ id: 'procedure.form.case-number' })}
            >
              <SwiftText>{procedure.caseNumber}</SwiftText>
            </LabeledContent>
            <LabeledContent
              label={intl.formatMessage({ id: 'procedure.form.favorite' })}
            >
              <SwiftText>{medicalCase.favorite ? 'Ja' : 'Nein'}</SwiftText>
            </LabeledContent>
          </Section>

          <Section
            title={intl.formatMessage({
              id: 'procedure.form.section.patient-info',
            })}
            modifiers={[listRowBackground(rowBackground)]}
          >
            <LabeledContent
              label={intl.formatMessage({ id: 'procedure.form.years' })}
            >
              <SwiftText>{`${procedure.ageYears}`}</SwiftText>
            </LabeledContent>
            <LabeledContent
              label={intl.formatMessage({ id: 'procedure.form.months' })}
            >
              <SwiftText>{`${procedure.ageMonths}`}</SwiftText>
            </LabeledContent>
          </Section>

          <Section
            title={intl.formatMessage({
              id: 'procedure.form.section.operation-info',
            })}
            modifiers={[listRowBackground(rowBackground)]}
          >
            <LabeledContent
              label={intl.formatMessage({ id: 'procedure.form.operation-date' })}
            >
              <SwiftText>
                {intl.formatDate(procedure.date, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </SwiftText>
            </LabeledContent>
            <LabeledContent
              label={intl.formatMessage({ id: 'procedure.form.asa-score' })}
            >
              <SwiftText>{`ASA ${procedure.asaScore}`}</SwiftText>
            </LabeledContent>
            <LabeledContent
              label={intl.formatMessage({
                id: 'procedure.form.airway-management',
              })}
            >
              <SwiftText>
                {getTranslatedAirwayManagement(procedure.airwayManagement)}
              </SwiftText>
            </LabeledContent>
            <LabeledContent
              label={intl.formatMessage({ id: 'procedure.form.department' })}
            >
              <SwiftText>{getTranslatedDepartment(procedure.department)}</SwiftText>
            </LabeledContent>
            <LabeledContent
              label={intl.formatMessage({
                id: 'procedure.form.local-anesthetics',
              })}
            >
              <SwiftText>{procedure.localAnesthetics ? 'Ja' : 'Nein'}</SwiftText>
            </LabeledContent>
            {procedure.localAnestheticsText && (
              <LabeledContent label="">
                <SwiftText>{procedure.localAnestheticsText}</SwiftText>
              </LabeledContent>
            )}
            <LabeledContent
              label={intl.formatMessage({ id: 'procedure.form.emergency' })}
            >
              <SwiftText>{procedure.emergency ? 'Ja' : 'Nein'}</SwiftText>
            </LabeledContent>
          </Section>

          {specials && specials.length > 0 && (
            <Section
              title={intl.formatMessage({
                id: 'procedure.form.section.specials',
              })}
              modifiers={[listRowBackground(rowBackground)]}
            >
              <SwiftText>
                {specials
                  .map((special) =>
                    intl.formatMessage({ id: `enum.specials.${special}` }),
                  )
                  .sort((a, b) => a.localeCompare(b))
                  .join(', ')}
              </SwiftText>
            </Section>
          )}

          {procedure.description && (
            <Section
              title={intl.formatMessage({ id: 'procedure.form.procedure' })}
              modifiers={[listRowBackground(rowBackground)]}
            >
              <SwiftText>{procedure.description}</SwiftText>
            </Section>
          )}
        </Form>
      </Host>
    </SafeAreaView>
  );
}
