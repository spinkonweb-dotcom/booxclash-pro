import React from 'react';
import { Lesson } from '../../Data/lessonData'; // Assuming lessonData.ts is in the same folder

// Define a standard prop type for all lesson components
export interface LessonComponentProps {
  lesson: Lesson;
  onComplete: () => void;
}

// -----------------------------------------------------------------
// 🌿 TOPIC 1.1: GROUPING THINGS
// -----------------------------------------------------------------
import G1_SortingByColor from './G1/G1_SortingByColor';
import G1_SortingByShape from './G1/G1_SortingByShape';
import G1_SortingBySize from './G1/G1_SortingBySize';
import G1_Grouping1to5 from './G1/G1_GroupingByQuantity';
import G1_CollectClassify from './G1/G1_CollectAndClassify';
import G1_DescribeMySet from './G1/G1_DescribeMe';
import G1_MatchItOneToOne from './G1/G1_OneToOneMatch';
import G1_OrderingGroups from './G1/G1_OrderingGroups';
import G1_OrdinalNumbers from './G1/G1_OrdinalNumbers';
import G1_AssignNumerals0to10 from './G1/G1_NumberTag';
import G1_EverydayNumbers from './G1/G1_EverydayNumbers';
import GroupingNumbersReview from './G1/GroupingReview';

// -----------------------------------------------------------------
// 🏞️ TOPIC 1.2: THINGS IN THE SURROUNDINGS
// -----------------------------------------------------------------
import G2_MatchingNumerals from './G2/G2_MatchingNumerals';
import G2_MoreOrLess from './G2/G2_MoreOrLess';
import G2_CaringForOurWorld from './G2/G2_CaringForOurWorld';
import G2_NaturalOrManMade from './G2/G2_NaturalOrManMade';
import G2_LetsCount1to100 from './G2/G2_LetsCount1to100';
import G2_SkipCountingFun2s5s10s from './G2/G2_SkipCountingFun2s5s10s';
import G2_ReadingWritingNumbers from './G2/G2_ReadingWritingNumbers';
import G2_AllAboutZero from './G2/G2_AllAboutZero';
import G2_TensAndOnes from './G2/G2_TensAndOnes';
import G2_UsingTenFrames from './G2/G2_UsingTenFrames';
import G2_NumberPatterns from './G2/G2_NumberPatterns';
import NumbersWorldReview from './G2/NumbersWorldReview';

// -----------------------------------------------------------------
// 🧍‍♂️ TOPIC 1.2: UNDERSTANDING MY BODY (Mapped to g3_ prefix)
// -----------------------------------------------------------------
import G3_BodyPartFunctionsMatch from './G3/G3_BodyPartFunctionsMatch';
import G3_MeasureWithMyBody from './G3/G3_MeasureWithMyBody';
import G3_ShortOrLong from './G3/G3_ShortOrLong';
import G3_FiveSensesAdventure from './G3/G3_FiveSensesAdventure';
import G3_SenseCount from './G3/G3_SenseCount';
import G3_BodySortingChallenge from './G3/G3_BodySortingChallenge';
import G3_MeasureIt from './G3/G3_MeasureIt';
import G3_EstimateCheck from './G3/G3_EstimateCheck';
import G3_OrderByLength from './G3/G3_OrderByLength';
import G3_HygieneHeroes from './G3/G3_HygieneHeroes';
import G3_CleanHandsHappyTummy from './G3/G3_CleanHandsHappyTummy';
import G3_HygieneSortGame from './G3/G3_HygieneSortGame';
import G3_DailyRoutineTracker from './G3/G3_DailyRoutineTracker';
import G3_FindTheGerms from './G3/G3_FindTheGerms';
import G3_WhatMakesUsSick from './G3/G3_WhatMakesUsSick';
import G3_SafeOrUnsafe from './G3/G3_SafeOrUnsafe';
import G3_HealthDefender from './G3/G3_HealthDefender';
import G3_StayHealthyQuiz from './G3/G3_StayHealthyQuiz';
import MyBodyHealthReview from './G3/MyBodyHealthReview';

// -----------------------------------------------------------------
// 🌤️ TOPIC 1.3: EXPLORING THE SKY AND SEASONS (Mapped to g4_ prefix)
// -----------------------------------------------------------------
import G4_DayOrNight from './G4/G4_DayOrNight';
import G4_MyDayPlanner from './G4/G4_MyDayPlanner';
import G4_DaysOfTheWeek from './G4/G4_DaysOfTheWeek';
import G4_MonthsOfTheYear from './G4/G4_MonthsOfTheYear';
import G4_WhatsTheWeather from './G4/G4_WhatsTheWeather';
import G4_HotOrCold from './G4/G4_HotOrCold';
import G4_DressForTheWeather from './G4/G4_DressForTheWeather';
import G4_ClimateDetective from './G4/G4_ClimateDetective';
import G4_GreenHero from './G4/G4_GreenHero';
import TimeWeatherReview from './G4/TimeWeatherReview';

// -----------------------------------------------------------------
// 🧱 TOPIC 1.4: EXPLORING MATERIALS (Mapped to g5_ prefix)
// -----------------------------------------------------------------
import G5_MaterialFinder from './G5/G5_MaterialFinder';
import G5_MaterialSortMatch from './G5/G5_MaterialSortMatch';
import G5_BuildIt from './G5/G5_BuildIt';
import G5_EnergySourceMatchUp from './G5/G5_EnergySourceMatchUp';
import G5_PowerTheWorld from './G5/G5_PowerTheWorld';
import G5_ShapeFinder from './G5/G5_ShapeFinder';
import G5_ShapeBuilder from './G5/G5_ShapeBuilder';
import G5_CleanOrDirtyWater from './G5/G5_CleanOrDirtyWater';
import G5_MakeWaterSafe from './G5/G5_MakeWaterSafe';
import G5_EcoGuardian from './G5/G5_EcoGuardian';
import MaterialsWorldReview from './G5/MaterialsWorldReview';

// -----------------------------------------------------------------
// 🧪 TOPIC 1.5: EXPLORING MIXTURES (Mapped to g6_ prefix)
// -----------------------------------------------------------------
import G6_MixItUp from './G6/G6_MixItUp';
import G6_MixtureSorter from './G6/G6_MixtureSorter';
import G6_AddItTogether from './G6/G6_AddItTogether';
import G6_TenFrameBuilder from './G6/G6_TenFrameBuilder';
import G6_ShoppingCartAddUp from './G6/G6_ShoppingCartAddUp';
import G6_BananaTakeAway from './G6/G6_BananaTakeAway';
import G6_FindTheMissingNumber from './G6/G6_FindTheMissingNumber';
import G6_WasteSorter from './G6/G6_WasteSorter';
import G6_PollutionDefender from './G6/G6_PollutionDefender';
import MixturesNumbersReview from './G6/MixturesNumbersReview';
import G3_BodyParts from './G3/G3_BodyParts';

// -----------------------------------------------------------------
// THE MASTER MAP
// -----------------------------------------------------------------
// This object maps each lesson ID from lessonData.ts to its
// corresponding React component.
// -----------------------------------------------------------------
export const lessonComponentMap: Record<string, React.ComponentType<LessonComponentProps>> = {
  // Topic 1.1
  'g1_1': G1_SortingByColor,
  'g1_2': G1_SortingByShape,
  'g1_3': G1_SortingBySize,
  'g1_4': G1_Grouping1to5,
  'g1_5': G1_CollectClassify,
  'g1_6': G1_DescribeMySet,
  'g1_7': G1_MatchItOneToOne,
  'g1_8': G1_OrderingGroups,
  'g1_9': G1_OrdinalNumbers,
  'g1_10': G1_AssignNumerals0to10,
  'g1_11': G1_EverydayNumbers,
  'g1_12': GroupingNumbersReview,

  // Topic 1.2 (Surroundings)
  'g2_1': G2_MatchingNumerals,
  'g2_2': G2_MoreOrLess,
  'g2_3': G2_CaringForOurWorld,
  'g2_4': G2_NaturalOrManMade,
  'g2_5': G2_LetsCount1to100,
  'g2_6': G2_SkipCountingFun2s5s10s,
  'g2_7': G2_ReadingWritingNumbers,
  'g2_8': G2_AllAboutZero,
  'g2_9': G2_TensAndOnes,
  'g2_10': G2_UsingTenFrames,
  'g2_11': G2_NumberPatterns,
  'g2_12': NumbersWorldReview,

  // Topic 1.2 (My Body)
  'g3_1': G3_BodyParts,
  'g3_2': G3_BodyPartFunctionsMatch,
  'g3_3': G3_MeasureWithMyBody,
  'g3_4': G3_ShortOrLong,
  'g3_5': G3_FiveSensesAdventure,
  'g3_6': G3_SenseCount,
  'g3_7': G3_BodySortingChallenge,
  'g3_8': G3_MeasureIt,
  'g3_9': G3_EstimateCheck,
  'g3_10': G3_OrderByLength,
  'g3_11': G3_HygieneHeroes,
  'g3_12': G3_CleanHandsHappyTummy,
  'g3_13': G3_HygieneSortGame,
  'g3_14': G3_DailyRoutineTracker,
  'g3_15': G3_FindTheGerms,
  'g3_16': G3_WhatMakesUsSick,
  'g3_17': G3_SafeOrUnsafe,
  'g3_18': G3_HealthDefender,
  'g3_19': G3_StayHealthyQuiz,
  'g3_20': MyBodyHealthReview, // Note the jump from review_2 to review_5, matching your data

  // Topic 1.3
  'g4_1': G4_DayOrNight,
  'g4_2': G4_MyDayPlanner,
  'g4_3': G4_DaysOfTheWeek,
  'g4_4': G4_MonthsOfTheYear,
  'g4_5': G4_WhatsTheWeather,
  'g4_6': G4_HotOrCold,
  'g4_7': G4_DressForTheWeather,
  'g4_8': G4_ClimateDetective,
  'g4_9': G4_GreenHero,
  'g4_10': TimeWeatherReview,

  // Topic 1.4
  'g5_1': G5_MaterialFinder,
  'g5_2': G5_MaterialSortMatch,
  'g5_3': G5_BuildIt,
  'g5_4': G5_EnergySourceMatchUp,
  'g5_5': G5_PowerTheWorld,
  'g5_6': G5_ShapeFinder,
  'g5_7': G5_ShapeBuilder,
  'g5_8': G5_CleanOrDirtyWater,
  'g5_9': G5_MakeWaterSafe,
  'g5_10': G5_EcoGuardian,
  'g5_11': MaterialsWorldReview,

  // Topic 1.5
  'g6_1': G6_MixItUp,
  'g6_2': G6_MixtureSorter,
  'g6_3': G6_AddItTogether,
  'g6_4': G6_TenFrameBuilder, // Note: You have G2_UsingTenFrames, could be re-used
  'g6_5': G6_ShoppingCartAddUp,
  'g6_6': G6_BananaTakeAway,
  'g6_7': G6_FindTheMissingNumber,
  'g6_8': G6_WasteSorter,
  'g6_9': G6_PollutionDefender,
  'g6_10': MixturesNumbersReview,
};
