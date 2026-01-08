import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeftCircle,
  Edit,
  FileQuestion,
  Siren,
  Check,
  X,
} from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useColorScheme } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useColors } from '~/hooks/useColors';
import { useIntl } from 'react-intl';
import { LoadingScreen } from '~/components/layout/LoadingScreen';
import { EmptyState } from '~/components/layout/EmptyState';
import { SafeAreaView } from 'react-native-safe-area-context';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

  return (
    <View style={[styles.row, { borderBottomColor: isLight ? '#E5E7EB' : '#2C2C2E' }]}>
      <Text style={[styles.label, { color: isLight ? '#6B7280' : '#9CA3AF' }]}>{label}</Text>
      <View style={styles.valueContainer}>
        {typeof value === 'string' ? (
          <Text style={[styles.value, { color: isLight ? '#1F2937' : '#FFFFFF' }]}>{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

function BooleanIndicator({ value }: { value: boolean }) {
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

  return value ? (
    <View style={[styles.booleanBadge, { backgroundColor: '#10B981' }]}>
      <Check size={14} color="#FFFFFF" />
      <Text style={styles.booleanText}>Ja</Text>
    </View>
  ) : (
    <View style={[styles.booleanBadge, { backgroundColor: isLight ? '#E5E7EB' : '#4A5568' }]}>
      <X size={14} color={isLight ? '#6B7280' : '#9CA3AF'} />
      <Text style={[styles.booleanText, { color: isLight ? '#6B7280' : '#9CA3AF' }]}>Nein</Text>
    </View>
  );
}

export default function ShowProcedure() {
  const intl = useIntl();
  const router = useRouter();

  const { procedureId } = useLocalSearchParams<{ procedureId: string }>();

  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

  const { data, isPending } = useQuery({
    queryKey: ['procedure', procedureId],
    queryFn: () => db.select().from(itemTable).where(eq(itemTable.caseNumber, procedureId)),
  });

  const { getDepartmentColor } = useColors();

  const getTranslatedAirwayManagement = (airway: string) => {
    return intl.formatMessage({ id: `enum.airway-management.${airway}` });
  };

  const getTranslatedDepartment = (department: string) => {
    return intl.formatMessage({ id: `enum.department.${department}` });
  };

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!data || data.length === 0) {
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

  const item = data[0];

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: isLight ? '#F2F2F7' : '#000000' }}>
      <Stack.Screen
        options={{
          title: procedureId,
          presentation: 'modal',
          headerLeft: () => (
            <PressableScale
              style={{ paddingHorizontal: 8 }}
              onPress={() => {
                router.back();
              }}>
              <ChevronLeftCircle size={24} color={isLight ? '#000' : '#fff'} />
            </PressableScale>
          ),
          headerRight: () => (
            <PressableScale
              style={{ paddingHorizontal: 8 }}
              onPress={() => {
                router.push(`/procedure/${procedureId}/edit`);
              }}>
              <Edit size={24} color={isLight ? '#000' : '#fff'} />
            </PressableScale>
          ),
        }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {item.emergency && (
          <View style={[styles.emergencyBanner, { backgroundColor: '#FEE2E2' }]}>
            <Siren size={20} color="#DC2626" />
            <Text style={styles.emergencyText}>Notfall</Text>
          </View>
        )}

        <View
          style={[
            styles.section,
            { backgroundColor: isLight ? '#FFFFFF' : '#1C1C1E' },
          ]}>
          <Text style={[styles.sectionTitle, { color: isLight ? '#6B7280' : '#8E8E93' }]}>
            {intl.formatMessage({ id: 'procedure.form.section.basic-info' })}
          </Text>
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.case-number' })}
            value={item.caseNumber}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.operation-date' })}
            value={intl.formatDate(item.date, { year: 'numeric', month: 'long', day: 'numeric' })}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.department' })}
            value={
              <View
                style={[
                  styles.departmentBadge,
                  { backgroundColor: getDepartmentColor(item.department) },
                ]}>
                <Text style={styles.departmentText}>{getTranslatedDepartment(item.department)}</Text>
              </View>
            }
          />
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: isLight ? '#FFFFFF' : '#1C1C1E' },
          ]}>
          <Text style={[styles.sectionTitle, { color: isLight ? '#6B7280' : '#8E8E93' }]}>
            {intl.formatMessage({ id: 'procedure.form.patient-age' })}
          </Text>
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.years' })}
            value={`${item.ageYears}`}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.months' })}
            value={`${item.ageMonths}`}
          />
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: isLight ? '#FFFFFF' : '#1C1C1E' },
          ]}>
          <Text style={[styles.sectionTitle, { color: isLight ? '#6B7280' : '#8E8E93' }]}>
            {intl.formatMessage({ id: 'procedure.form.section.details' })}
          </Text>
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.asa-score' })}
            value={`ASA ${item.asaScore}`}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.airway-management' })}
            value={
              <View style={[styles.airwayBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.airwayText}>
                  {getTranslatedAirwayManagement(item.airwayManagement)}
                </Text>
              </View>
            }
          />
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: isLight ? '#FFFFFF' : '#1C1C1E' },
          ]}>
          <Text style={[styles.sectionTitle, { color: isLight ? '#6B7280' : '#8E8E93' }]}>
            {intl.formatMessage({ id: 'procedure.form.section.settings' })}
          </Text>
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.outpatient' })}
            value={<BooleanIndicator value={item.outpatient} />}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.emergency' })}
            value={<BooleanIndicator value={item.emergency} />}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.analgosedation' })}
            value={<BooleanIndicator value={item.analgosedation} />}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.favorite' })}
            value={<BooleanIndicator value={item.favorite} />}
          />
          <DetailRow
            label={intl.formatMessage({ id: 'procedure.form.local-anesthetics' })}
            value={<BooleanIndicator value={item.localAnesthetics} />}
          />
          {item.localAnestheticsText && (
            <DetailRow label="" value={item.localAnestheticsText} />
          )}
        </View>

        {item.specials && (
          <View
            style={[
              styles.section,
              { backgroundColor: isLight ? '#FFFFFF' : '#1C1C1E' },
            ]}>
            <Text style={[styles.sectionTitle, { color: isLight ? '#6B7280' : '#8E8E93' }]}>
              {intl.formatMessage({ id: 'procedure.form.special-features' })}
            </Text>
            <View style={styles.textBlock}>
              <Text style={[styles.textBlockContent, { color: isLight ? '#1F2937' : '#FFFFFF' }]}>
                {item.specials}
              </Text>
            </View>
          </View>
        )}

        {item.procedure && (
          <View
            style={[
              styles.section,
              { backgroundColor: isLight ? '#FFFFFF' : '#1C1C1E' },
            ]}>
            <Text style={[styles.sectionTitle, { color: isLight ? '#6B7280' : '#8E8E93' }]}>
              {intl.formatMessage({ id: 'procedure.form.procedure' })}
            </Text>
            <View style={styles.textBlock}>
              <Text style={[styles.textBlockContent, { color: isLight ? '#1F2937' : '#FFFFFF' }]}>
                {item.procedure}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  emergencyText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  valueContainer: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  departmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  departmentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  airwayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  airwayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  booleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  booleanText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  textBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  textBlockContent: {
    fontSize: 16,
    lineHeight: 24,
  },
});
