import { useQuery } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeftCircle,
  Edit,
  FileQuestion,
  Siren,
  Star,
} from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, Text, View } from 'react-native';
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

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Text className="mb-2 ml-1 text-xs font-semibold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
    {children}
  </Text>
);

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-1 rounded-2xl border border-black/5 bg-background-secondary-light p-3 dark:border-white/5 dark:bg-background-secondary-dark">
    <Text
      className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark"
      numberOfLines={1}
    >
      {label}
    </Text>
    <Text
      className="mt-1 text-xl font-bold tabular-nums text-text-primary-light dark:text-text-primary-dark"
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
  </View>
);

const Chip = ({ children }: { children: ReactNode }) => (
  <View className="rounded-full bg-black/5 px-3 py-1.5 dark:bg-white/10">
    <Text className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
      {children}
    </Text>
  </View>
);

export default function ShowProcedure() {
  const intl = useIntl();
  const router = useRouter();
  const { getDepartmentHexColor, getDepartmentTextClass } = useColors();

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
  const departmentColor = getDepartmentHexColor(procedure.department);

  const ageValue =
    procedure.ageYears > 0
      ? procedure.ageMonths > 0
        ? `${procedure.ageYears} ${intl.formatMessage({ id: 'unit.years-short' })} ${procedure.ageMonths} ${intl.formatMessage({ id: 'unit.months-short' })}`
        : `${procedure.ageYears} ${intl.formatMessage({ id: 'unit.years-short' })}`
      : `${procedure.ageMonths} ${intl.formatMessage({ id: 'unit.months-short' })}`;

  const specialLabels = specials
    .map((special) => intl.formatMessage({ id: `enum.specials.${special}` }))
    .sort((a, b) => a.localeCompare(b));

  const hasFlags =
    specialLabels.length > 0 ||
    procedure.localAnesthetics ||
    procedure.localAnestheticsText;

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
        <View
          className="mb-6 rounded-2xl border p-4"
          style={{
            backgroundColor: `${departmentColor}1A`,
            borderColor: `${departmentColor}33`,
          }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${departmentColor}26` }}
            >
              <Text
                className={cn(
                  'text-xs font-bold',
                  getDepartmentTextClass(procedure.department),
                )}
                numberOfLines={1}
              >
                {procedure.department === 'other' ? '?' : procedure.department}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className={cn(
                  'text-sm font-semibold',
                  getDepartmentTextClass(procedure.department),
                )}
                numberOfLines={1}
              >
                {procedure.department === 'other' && procedure.departmentOther
                  ? procedure.departmentOther
                  : intl.formatMessage({
                      id: `enum.department.${procedure.department}`,
                    })}
              </Text>
              <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {intl.formatDate(procedure.date, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <Text className="mt-3 text-3xl font-bold tabular-nums text-text-primary-light dark:text-text-primary-dark">
            {procedure.caseNumber}
          </Text>
          {(procedure.emergency || medicalCase.favorite) && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {procedure.emergency && (
                <View className="flex-row items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5">
                  <Siren size={14} color="#FFFFFF" />
                  <Text className="text-sm font-semibold text-white">
                    {intl.formatMessage({ id: 'procedure.form.emergency' })}
                  </Text>
                </View>
              )}
              {medicalCase.favorite && (
                <View className="flex-row items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5">
                  <Star size={14} color="#000000" fill="#000000" />
                  <Text className="text-sm font-semibold text-black">
                    {intl.formatMessage({ id: 'procedure.form.favorite' })}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View className="mb-6 flex-row gap-2">
          <StatTile
            label={intl.formatMessage({ id: 'procedure.form.asa-score' })}
            value={`${procedure.asaScore}`}
          />
          <StatTile
            label={intl.formatMessage({ id: 'show.age' })}
            value={ageValue}
          />
          <StatTile
            label={intl.formatMessage({ id: 'show.airway' })}
            value={intl.formatMessage({
              id: `enum.airway-management.${procedure.airwayManagement}`,
            })}
          />
        </View>
        {hasFlags && (
          <View className="mb-6">
            <SectionLabel>
              {intl.formatMessage({ id: 'procedure.form.section.specials' })}
            </SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {procedure.localAnesthetics && (
                <Chip>
                  {intl.formatMessage({
                    id: 'procedure.form.local-anesthetics',
                  })}
                </Chip>
              )}
              {specialLabels.map((label) => (
                <Chip key={label}>{label}</Chip>
              ))}
            </View>
            {procedure.localAnestheticsText ? (
              <View className="mt-3 rounded-2xl border border-black/5 bg-background-secondary-light p-4 dark:border-white/5 dark:bg-background-secondary-dark">
                <Text className="text-base leading-6 text-text-primary-light dark:text-text-primary-dark">
                  {procedure.localAnestheticsText}
                </Text>
              </View>
            ) : null}
          </View>
        )}
        {procedure.description ? (
          <View className="mb-6">
            <SectionLabel>
              {intl.formatMessage({ id: 'procedure.form.procedure' })}
            </SectionLabel>
            <View className="rounded-2xl border border-black/5 bg-background-secondary-light p-4 dark:border-white/5 dark:bg-background-secondary-dark">
              <Text className="text-base leading-6 text-text-primary-light dark:text-text-primary-dark">
                {procedure.description}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
