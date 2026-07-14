export const roleLabels = {
  ADMIN: 'Admin',
  THERAPIST: 'Therapist',
  PATIENT: 'Patient',
};

export const roleMenus = {
  ADMIN: [
    'Create Therapist',
  ],
  THERAPIST: [
    'Manage Sessions',
    'View Assigned Therapies',
    'Patient History',
  ],
  PATIENT: [
    'Appointment Status',
    'Treatment History',
    'Recovery Insights',
    'Feedback',
  ],
};

export const recoveryTrend = [
  { session: 'S1', pain: 8, sleep: 4, energy: 3 },
  { session: 'S2', pain: 7, sleep: 5, energy: 4 },
  { session: 'S3', pain: 6, sleep: 6, energy: 5 },
  { session: 'S4', pain: 5, sleep: 7, energy: 6 },
  { session: 'S5', pain: 4, sleep: 8, energy: 7 },
];

export const predictions = [
  { label: 'Poor', color: 'bg-rose-500', range: '< 40%' },
  { label: 'Moderate', color: 'bg-amber-500', range: '40 - 60%' },
  { label: 'Good', color: 'bg-lime-500', range: '61 - 80%' },
  { label: 'Excellent', color: 'bg-emerald-600', range: '> 80%' },
];

export const doshaAssessmentFields = [
  {
    key: 'bodyBuild',
    label: '1. What is your body build?',
    options: ['Thin and lean', 'Medium and athletic', 'Broad and sturdy'],
  },
  {
    key: 'skinType',
    label: '2. What is your skin type?',
    options: ['Dry and rough', 'Warm and sensitive', 'Soft and oily'],
  },
  {
    key: 'appetite',
    label: '3. How is your appetite?',
    options: ['Irregular', 'Strong and frequent', 'Moderate and steady'],
  },
  {
    key: 'digestion',
    label: '4. How is your digestion?',
    options: ['Gas or bloating', 'Acidity or heartburn', 'Slow digestion'],
  },
  {
    key: 'sleepPattern',
    label: '5. How do you sleep?',
    options: ['Light and interrupted', 'Moderate', 'Deep and long'],
  },
  {
    key: 'energyLevel',
    label: '6. How is your energy level?',
    options: ['Variable', 'Active and energetic', 'Calm and steady'],
  },
  {
    key: 'stressResponse',
    label: '7. How do you react to stress?',
    options: ['Anxious or worried', 'Irritated or angry', 'Calm or withdrawn'],
  },
  {
    key: 'climatePreference',
    label: '8. Which climate do you prefer?',
    options: ['Warm', 'Cool', 'Dry or moderate'],
  },
  {
    key: 'walkingStyle',
    label: '9. How do you usually walk?',
    options: ['Fast', 'Moderate', 'Slow and steady'],
  },
  {
    key: 'personality',
    label: '10. How would you describe your personality?',
    options: ['Creative and enthusiastic', 'Confident and ambitious', 'Calm and patient'],
  },
];

export const doshaTherapies = {
  VATA: ['Abhyanga', 'Basti', 'Shirodhara'],
  PITTA: ['Shirodhara', 'Virechana'],
  KAPHA: ['Udvartana', 'Nasya', 'Vamana'],
};
