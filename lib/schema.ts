import { Schema } from 'effect';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from './options';

export const Item = Schema.Struct({
  caseNumber: Schema.String,
  patientAgeYears: Schema.NonNegative,
  patientAgeMonths: Schema.NonNegative,
  operationDate: Schema.DateTimeUtc,
  asaScore: Schema.Literal(1, 2, 3, 4, 5, 6),
  airwayManagement: Schema.Literal(...AIRWAY_OPTIONS),
  department: Schema.Literal(...DEPARTMENT_OPTIONS),
  departmentOther: Schema.String,
  specialFeatures: Schema.Boolean,
  specialFeaturesText: Schema.String,
  localAnesthetics: Schema.Boolean,
  localAnestheticsText: Schema.String,
  outpatient: Schema.Boolean,
  emergency: Schema.Boolean,
  analgosedation: Schema.Boolean,
  favorite: Schema.Boolean,
  procedure: Schema.String,
});
