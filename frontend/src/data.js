export const roleLabels = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  THERAPIST: 'Therapist',
  PATIENT: 'Patient',
};

export const roleMenus = {
  ADMIN: [
    'Dashboard',
    'Manage Doctors',
    'Manage Therapists',
    'Manage Patients',
    'Manage Therapies',
    'Appointments',
    'Therapy Rooms',
    'Recovery Reports',
    'Feedback & Ratings',
    'Notifications',
  ],
  DOCTOR: [
    'Appointments',
    'Medical History',
    'Consultation',
    'Dosha Assessment',
    'Therapy Recommendations',
    'Recovery Progress',
    'AI Prediction',
    'Prescriptions & Notes',
  ],
  THERAPIST: [
    'Assigned Therapies',
    'Completed Sessions',
    'Session Details',
    'Pain / Sleep / Energy',
    'Patient History',
  ],
  PATIENT: [
    'Profile',
    'Dosha Questionnaire',
    'Book Consultation',
    'Book Therapy',
    'Appointment Status',
    'Treatment History',
    'Recovery Charts',
    'AI Recovery Prediction',
    'Feedback',
    'Notifications',
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
