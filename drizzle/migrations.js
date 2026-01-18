// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './0000_tiny_kingpin.sql';
import m0001 from './0001_amazing_skin.sql';
import m0002 from './0002_mighty_tusk.sql';
import m0003 from './0003_rapid_thaddeus_ross.sql';
import m0004 from './0004_thick_tinkerer.sql';
import m0005 from './0005_wakeful_lilith.sql';
import m0006 from './0006_daily_roulette.sql';
import m0007 from './0007_tricky_the_santerians.sql';
import m0008 from './0008_medical_case_migration.sql';
import m0009 from './0009_harsh_norrin_radd.sql';
import m0010 from './0010_crazy_caretaker.sql';
import journal from './meta/_journal.json';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004,
    m0005,
    m0006,
    m0007,
    m0008,
    m0009,
    m0010,
  },
};
