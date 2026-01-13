import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FlaskConical, 
  Microscope, 
  Zap, 
  TestTube, 
  Timer,
  Calendar,
  Trophy,
  BookOpen,
  Play,
  Star,
  Award,
  Target,
  Clock
} from 'lucide-react';

interface Experiment {
  _id: string;
  name: string;
  thumbnailUrl: string;
  materials: string[];
  tools: string[];
  result: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  category: 'Chemistry' | 'Physics' | 'Biology';
  description: string;
}

const API_BASE = "https://backend-162267981396.us-central1.run.app";
type Section = 'experiments' | 'grades' | 'tests' | 'schedule';

// Mock data for realistic lab experiments
const mockExperiments: Experiment[] = [
  {
    _id: '1',
    name: 'Acid-Base Titration',
    thumbnailUrl: '/api/placeholder/200/150',
    materials: ['HCl Solution', 'NaOH Solution', 'Phenolphthalein Indicator', 'Distilled Water'],
    tools: ['Burette', 'Conical Flask', 'Pipette', 'Beaker', 'Stirring Rod'],
    result: 'Determine the concentration of unknown acid solution',
    difficulty: 'Intermediate',
    duration: '45 min',
    category: 'Chemistry',
    description: 'Learn to perform precise acid-base titrations using laboratory equipment'
  },
  {
    _id: '2',
    name: 'Microscopic Cell Study',
    thumbnailUrl: '/api/placeholder/200/150',
    materials: ['Onion Skin', 'Iodine Solution', 'Cover Slips', 'Glass Slides'],
    tools: ['Compound Microscope', 'Forceps', 'Dropper', 'Lens Paper'],
    result: 'Observe plant cell structure and organelles',
    difficulty: 'Beginner',
    duration: '30 min',
    category: 'Biology',
    description: 'Explore the microscopic world of plant cells and their components'
  },
  {
    _id: '3',
    name: 'Electromagnetic Induction',
    thumbnailUrl: '/api/placeholder/200/150',
    materials: ['Copper Wire Coil', 'Bar Magnet', 'LED Bulb', 'Connecting Wires'],
    tools: ['Galvanometer', 'Multimeter', 'Iron Core', 'Switch'],
    result: 'Generate electricity using magnetic fields',
    difficulty: 'Advanced',
    duration: '60 min',
    category: 'Physics',
    description: 'Demonstrate Faraday\'s law of electromagnetic induction'
  },
  {
    _id: '4',
    name: 'Crystal Growth Lab',
    thumbnailUrl: '/api/placeholder/200/150',
    materials: ['Salt Solution', 'Sugar Solution', 'Alum Powder', 'String'],
    tools: ['Beakers', 'Stirring Rod', 'Measuring Cylinder', 'Hot Plate'],
    result: 'Grow different types of crystals',
    difficulty: 'Beginner',
    duration: '2 hours',
    category: 'Chemistry',
    description: 'Understand crystallization process and crystal structures'
  },
  {
    _id: '5',
    name: 'Photosynthesis Investigation',
    thumbnailUrl: '/api/placeholder/200/150',
    materials: ['Aquatic Plants', 'Sodium Bicarbonate', 'Test Tubes', 'Water'],
    tools: ['Light Source', 'Measuring Cylinder', 'Thermometer', 'pH Strips'],
    result: 'Measure oxygen production in photosynthesis',
    difficulty: 'Intermediate',
    duration: '90 min',
    category: 'Biology',
    description: 'Investigate factors affecting the rate of photosynthesis'
  },
  {
    _id: '6',
    name: 'Pendulum Motion Analysis',
    thumbnailUrl: '/api/placeholder/200/150',
    materials: ['Metal Bob', 'String', 'Protractor', 'Ruler'],
    tools: ['Stopwatch', 'Clamp Stand', 'Measuring Tape', 'Calculator'],
    result: 'Calculate gravitational acceleration',
    difficulty: 'Intermediate',
    duration: '40 min',
    category: 'Physics',
    description: 'Study simple harmonic motion and calculate g using pendulum'
  }
];

const categoryIcons = {
  Chemistry: FlaskConical,
  Physics: Zap,
  Biology: Microscope
};

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-700 border-green-200',
  Intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Advanced: 'bg-red-100 text-red-700 border-red-200'
};

function StudentsLabHome() {
  const [activeSection, setActiveSection] = useState<Section>('experiments');
  const [experiments, setExperiments] = useState<Experiment[]>(mockExperiments);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/experiments`);
        if (response.data && response.data.length > 0) {
          setExperiments(response.data);
        }
      } catch (error) {
        console.error('Error fetching experiments:', error);
        // Keep using mock data if API fails
      }
    };

    fetchExperiments();
  }, []);

  const startExperiment = (experiment: Experiment) => {
    navigate('/student-experiment-room', { state: { id: experiment._id, experiment } });
  };

  const filteredExperiments = selectedCategory === 'All' 
    ? experiments 
    : experiments.filter(exp => exp.category === selectedCategory);

  const sectionButtons = [
    { key: 'experiments', label: 'Lab Experiments', icon: FlaskConical, color: 'bg-blue-500 hover:bg-blue-600' },
    { key: 'grades', label: 'Lab Reports', icon: Trophy, color: 'bg-green-500 hover:bg-green-600' },
    { key: 'tests', label: 'Lab Tests', icon: BookOpen, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { key: 'schedule', label: 'Lab Schedule', icon: Calendar, color: 'bg-purple-500 hover:bg-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Virtual Science Laboratory</h1>
            <p className="text-blue-100">Conduct real experiments with virtual lab equipment</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">24</div>
            <div className="text-sm text-blue-100">Experiments</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-blue-100">Completed</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">85%</div>
            <div className="text-sm text-blue-100">Avg Score</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm text-blue-100">Certificates</div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sectionButtons.map((button) => {
          const IconComponent = button.icon;
          return (
            <button
              key={button.key}
              onClick={() => setActiveSection(button.key as Section)}
              className={`
                p-4 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg
                ${activeSection === button.key ? 'ring-4 ring-blue-200 scale-105' : ''}
                ${button.color}
              `}
            >
              <IconComponent className="w-6 h-6 mx-auto mb-2" />
              {button.label}
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      {activeSection === 'experiments' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Chemistry', 'Physics', 'Biology'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-4 py-2 rounded-full font-medium transition-all duration-200
                  ${selectedCategory === category 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Experiments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiments.map((exp) => {
              const CategoryIcon = categoryIcons[exp.category];
              return (
                <div
                  key={exp._id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden border border-gray-100"
                >
                  {/* Experiment Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    <CategoryIcon className="w-16 h-16 text-blue-500" />
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border ${difficultyColors[exp.difficulty]}`}>
                      {exp.difficulty}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">{exp.category}</span>
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{exp.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exp.description}</p>
                    
                    {/* Duration and Tools */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {exp.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <TestTube className="w-4 h-4" />
                        {exp.tools.length} tools
                      </div>
                    </div>

                    {/* Materials Preview */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-1">Materials:</p>
                      <div className="flex flex-wrap gap-1">
                        {exp.materials.slice(0, 3).map((material, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {material}
                          </span>
                        ))}
                        {exp.materials.length > 3 && (
                          <span className="text-xs text-gray-500">+{exp.materials.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => startExperiment(exp)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Play className="w-5 h-5" />
                      Start Experiment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lab Reports Section */}
      {activeSection === 'grades' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Lab Reports & Grades
            </h2>
            
            <div className="grid gap-4">
              {[
                { name: 'Acid-Base Titration', score: 92, status: 'Completed', date: '2024-01-15' },
                { name: 'Microscopic Cell Study', score: 88, status: 'Completed', date: '2024-01-12' },
                { name: 'Electromagnetic Induction', score: 95, status: 'Completed', date: '2024-01-10' },
                { name: 'Crystal Growth Lab', score: 0, status: 'Pending', date: '2024-01-18' },
              ].map((report, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      report.status === 'Completed' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {report.status === 'Completed' ? 
                        <Award className="w-6 h-6 text-green-600" /> : 
                        <Clock className="w-6 h-6 text-yellow-600" />
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-500">Submitted: {report.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {report.status === 'Completed' ? (
                      <div className="text-2xl font-bold text-green-600">{report.score}%</div>
                    ) : (
                      <div className="text-sm font-medium text-yellow-600">Pending Review</div>
                    )}
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      report.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lab Tests Section */}
      {activeSection === 'tests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              Lab Assessments
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-800">Upcoming Tests</h3>
                {[
                  { name: 'Chemistry Lab Safety Quiz', date: '2024-01-20', duration: '30 min' },
                  { name: 'Physics Measurement Test', date: '2024-01-25', duration: '45 min' },
                ].map((test, idx) => (
                  <div key={idx} className="p-4 border border-blue-200 rounded-xl bg-blue-50">
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {test.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {test.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-800">Completed Tests</h3>
                {[
                  { name: 'Lab Equipment Identification', score: 94, date: '2024-01-15' },
                  { name: 'Chemical Safety Protocol', score: 89, date: '2024-01-10' },
                ].map((test, idx) => (
                  <div key={idx} className="p-4 border border-green-200 rounded-xl bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{test.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">Completed: {test.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">{test.score}%</div>
                        <Star className="w-5 h-5 text-yellow-500 mx-auto" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Schedule Section */}
      {activeSection === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-500" />
              Lab Schedule
            </h2>
            
            <div className="grid gap-4">
              {[
                { 
                  title: 'Virtual Chemistry Session', 
                  time: 'Monday 9:00 AM - 10:30 AM', 
                  instructor: 'Dr. Smith',
                  type: 'Live Session',
                  color: 'bg-blue-500'
                },
                { 
                  title: 'Biology Lab Practice', 
                  time: 'Wednesday 2:00 PM - 3:30 PM', 
                  instructor: 'Prof. Johnson',
                  type: 'Practical',
                  color: 'bg-green-500'
                },
                { 
                  title: 'Physics Experiment Review', 
                  time: 'Friday 11:00 AM - 12:00 PM', 
                  instructor: 'Dr. Brown',
                  type: 'Review',
                  color: 'bg-purple-500'
                },
              ].map((session, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`w-4 h-16 ${session.color} rounded-full`}></div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{session.title}</h3>
                    <p className="text-gray-600">{session.time}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-500">👨‍🔬 {session.instructor}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.type === 'Live Session' ? 'bg-red-100 text-red-700' :
                        session.type === 'Practical' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {session.type}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentsLabHome;
