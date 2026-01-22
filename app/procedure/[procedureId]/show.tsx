import { useQuery } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeftCircle,
  Edit,
  FileQuestion,
  Siren,
  Check,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '~/components/layout/EmptyState';
import { LoadingScreen } from '~/components/layout/LoadingScreen';
import { db } from '~/db/db';
import {
  procedureTable,
  procedureSpecialTable,
  medicalCaseTable,
} from '~/db/schema';
import { useColors } from '~/hooks/useColors';
import { cn } from '~/lib/cn';

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <View
      className="flex-row items-center justify-between border-b border-border-secondary px-4 py-3"
      style={{ borderBottomWidth: StyleSheet.hairlineWidth }}
    >
      <Text className="flex-1 text-base text-foreground-secondary">
        {label}
      </Text>
      <View className="shrink-0 items-end">
        {typeof value === 'string' ? (
          <Text className="text-base font-medium text-foreground">{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

function BooleanIndicator({ value }: { value: boolean }) {
  const { colorScheme } = useColorScheme();

  return value ? (
    <View className="flex-row items-center gap-1 rounded-lg bg-success px-2.5 py-1">
      <Check size={14} color="#FFFFFF" />
      <Text className="text-sm font-medium text-white">Ja</Text>
    </View>
  ) : (
    <View className="flex-row items-center gap-1 rounded-lg bg-border-secondary px-2.5 py-1">
      <X size={14} color={colorScheme === 'light' ? '#6B7280' : '#9CA3AF'} />
      <Text className="text-sm font-medium text-foreground-secondary">
        Nein
      </Text>
    </View>
  );
}

export default function ShowProcedure() {
  const intl = useIntl();
  const router = useRouter();

  const { procedureId: procedureIdParam } = useLocalSearchParams<{
    procedureId: string;
  }>();
  const procedureId = parseInt(procedureIdParam, 10);

  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

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

  const { getDepartmentClass } = useColors();

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
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background-tertiary">
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
              <ChevronLeftCircle size={24} color={isLight ? '#000' : '#fff'} />
            </PressableScale>
          ),
          headerRight: () => (
            <PressableScale
              className="px-2"
              onPress={() => {
                router.push(`/procedure/${procedureId}/edit`);
              }}
            >
              <Edit size={24} color={isLight ? '#000' : '#fff'} />
            </PressableScale>
          ),
        }}
      />
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
        {procedure.emergency && (
          <View className="flex-row items-center justify-center gap-2 rounded-xl bg-error-light px-4 py-3">
            <Siren size={20} color="#DC2626" />
            <Text className="text-base font-semibold text-error-dark">
              Notfall
            </Text>
          </View>
        )}

        <View className="overflow-hidden rounded-xl bg-card">
          <Text className="px-4 pb-2 pt-3 text-[13px] font-medium uppercase text-foreground-secondary">
            {intl.formatMessage({ id: 'procedure.form.section.case-info' })}
          </Text>
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.case-number' })}
            value={procedure.caseNumber}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.favorite' })}
            value={<BooleanIndicator value={medicalCase.favorite} />}
          />
        </View>

        <View className="overflow-hidden rounded-xl bg-card">
          <Text className="px-4 pb-2 pt-3 text-[13px] font-medium uppercase text-foreground-secondary">
            {intl.formatMessage({ id: 'procedure.form.section.patient-info' })}
          </Text>
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.years' })}
            value={`${procedure.ageYears}`}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.months' })}
            value={`${procedure.ageMonths}`}
          />
        </View>

        <View className="overflow-hidden rounded-xl bg-card">
          <Text className="px-4 pb-2 pt-3 text-[13px] font-medium uppercase text-foreground-secondary">
            {intl.formatMessage({
              id: 'procedure.form.section.operation-info',
            })}
          </Text>
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.operation-date' })}
            value={intl.formatDate(procedure.date, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.asa-score' })}
            value={`ASA ${procedure.asaScore}`}
          />
          <DetailRow
            label={intl.formatMessage({
              id: 'procedure.form.airway-management',
            })}
            value={
              <View className="rounded-lg bg-success px-3 py-1">
                <Text className="text-sm font-medium text-white">
                  {getTranslatedAirwayManagement(procedure.airwayManagement)}
                </Text>
              </View>
            }
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.department' })}
            value={
              <View
                className={cn(
                  'rounded-full px-3 py-1',
                  getDepartmentClass(procedure.department),
                )}
              >
                <Text className="text-sm font-medium text-white">
                  {getTranslatedDepartment(procedure.department)}
                </Text>
              </View>
            }
          />
          <DetailRow
            label={intl.formatMessage({
              id: 'procedure.form.local-anesthetics',
            })}
            value={<BooleanIndicator value={procedure.localAnesthetics} />}
          />
          {procedure.localAnestheticsText && (
            <DetailRow label="" value={procedure.localAnestheticsText} />
          )}
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.emergency' })}
            value={<BooleanIndicator value={procedure.emergency} />}
          />
        </View>

        {specials && specials.length > 0 && (
          <View className="overflow-hidden rounded-xl bg-card">
            <Text className="px-4 pb-2 pt-3 text-[13px] font-medium uppercase text-foreground-secondary">
              {intl.formatMessage({ id: 'procedure.form.section.specials' })}
            </Text>
            <View className="flex-row flex-wrap gap-2 px-4 pb-4">
              {specials
                .map((special) => ({
                  value: special,
                  label: intl.formatMessage({ id: `enum.specials.${special}` }),
                }))
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((special) => (
                  <View
                    key={special.value}
                    className="rounded-lg bg-[#6366F1] px-3 py-1.5"
                  >
                    <Text className="text-sm font-medium text-white">
                      {special.label}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {procedure.description && (
          <View className="overflow-hidden rounded-xl bg-card">
            <Text className="px-4 pb-2 pt-3 text-[13px] font-medium uppercase text-foreground-secondary">
              {intl.formatMessage({ id: 'procedure.form.procedure' })}
            </Text>
            <View className="px-4 pb-4">
              <Text className="text-base leading-6 text-foreground">
                {procedure.description}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
