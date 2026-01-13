import React from 'react';
import { useParams } from 'react-router-dom';

// ---------------------- IMPORTS ----------------------

// Grade 1 Dashboards (Local & Cambridge)
import DashboardGradeOneLocalMathScience from './FoundationDashboard/Local/GradeOne/Math-Science/DashboardGradeOneLocal';
import DashboardGradeOneScienceCambridge from './FoundationDashboard/Cambridge/GradeOne/Science/DashboardGradeOneScienceCambridge';
import DashboardGradeOneMathCambridge from './FoundationDashboard/Cambridge/GradeOne/Math/DashboardGradeOneMathCambridge';

// Reading Program Dashboards
import DashboardStarterReading from './Reading/Starter/DashboardReadingStarter';
import ComingSoon from './ComingSoon';
// import DashboardBasicReading from './Reading/Basic/DashboardReadingBasic';
// import DashboardDevelopingReading from './Reading/Developing/DashboardReadingDeveloping';
// import DashboardConfidentReading from './Reading/Confident/DashboardReadingConfident';
// import DashboardProficientReading from './Reading/Proficient/DashboardReadingProficient';
// import DashboardMasteryReading from './Reading/Mastery/DashboardReadingMastery';

// ---------------------- CONSTANTS ----------------------

const GRADE_MAP: Record<string, string> = {
  '1': 'GradeOne',
  '2': 'GradeTwo',
  '3': 'GradeThree',
  '4': 'GradeFour',
  '5': 'GradeFive',
  '6': 'GradeSix',
};

// Component registry
const DASHBOARD_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // Math / Science
  'local_math-science_GradeOne': DashboardGradeOneLocalMathScience,
  'cambridge_science_GradeOne': DashboardGradeOneScienceCambridge,
  'cambridge_math_GradeOne': DashboardGradeOneMathCambridge,

  // Reading
  'reading_starter': DashboardStarterReading,
  // 'reading_basic': DashboardBasicReading,
  // 'reading_developing': DashboardDevelopingReading,
  // 'reading_confident': DashboardConfidentReading,
  // 'reading_proficient': DashboardProficientReading,
  // 'reading_mastery': DashboardMasteryReading,
};

// ---------------------- COMPONENT ----------------------

const DynamicDashboardRouter: React.FC = () => {
  const { curriculumType, subject, grade } = useParams<{
    curriculumType: string;
    subject: string;
    grade: string;
  }>();

  if (!curriculumType || !subject || !grade) {
    return <div>Error: Missing curriculum, subject, or grade.</div>;
  }

  // Normalize subject
  const normalizedSubject = subject.toLowerCase().replace('/', '-').replace(' ', '-');

  let key = '';

  // ---------------------- READING PROGRAM ----------------------
  if (normalizedSubject === 'reading-program') {
    const normalizedLevel = grade.toLowerCase();
    key = `reading_${normalizedLevel}`;
  }

  // ---------------------- STANDARD SUBJECTS ----------------------
  else {
    const gradeFolder = GRADE_MAP[grade];

    if (!gradeFolder) {
      return <div>Error: Unknown grade "{grade}"</div>;
    }

    const normalizedCurriculum = curriculumType.toLowerCase();
    key = `${normalizedCurriculum}_${normalizedSubject}_${gradeFolder}`;
  }

  const TargetComponent = DASHBOARD_COMPONENTS[key];

  if (!TargetComponent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Dashboard Not Found</h2>
        <p className="text-gray-600 mt-2">
          Could not locate dashboard with key:
          <br />
          <code className="bg-gray-100 px-2 py-1 rounded">{key}</code>
        </p>
        <p className="text-sm text-gray-500 mt-4">
          (Params: {curriculumType}, {subject}, {grade})
        </p>
      </div>
    );
  }

  return <TargetComponent />;
};

export default DynamicDashboardRouter;
