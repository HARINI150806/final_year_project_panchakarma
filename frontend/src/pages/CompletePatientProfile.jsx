import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Heart, Shield, Activity, Loader2 } from 'lucide-react';
import api from '../api';

const OCCUPATIONS = [
  'Student',
  'Employee',
  'Teacher',
  'Business',
  'Self-Employed',
  'Homemaker',
  'Farmer',
  'Retired',
  'Unemployed',
];

const HEALTH_CONDITIONS = [
  'None',
  'Diabetes',
  'High Blood Pressure / Hypertension',
  'Low Blood Pressure',
  'Asthma',
  'Thyroid Disorder',
  'Arthritis',
  'Heart Disease',
  'Migraine',
  'Digestive Disorder',
  'Skin Disorder',
];

const ALLERGIES = [
  'None',
  'Dust Allergy',
  'Pollen Allergy',
  'Food Allergy',
  'Dairy Allergy',
  'Nut Allergy',
  'Seafood Allergy',
  'Medicine / Drug Allergy',
  'Skin Allergy',
  'Latex Allergy',
];

const PREVIOUS_TREATMENTS = [
  'No Previous Treatment',
  'Ayurveda Treatment',
  'Panchakarma Treatment',
  'Allopathic / Modern Medicine Treatment',
  'Homeopathy Treatment',
  'Siddha Treatment',
  'Physiotherapy',
  'Surgery',
];

const splitKnownAndOther = (values = [], knownValues) => {
  const names = values.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean);
  const known = names.filter((name) => knownValues.includes(name));
  const other = names.find((name) => !knownValues.includes(name)) || '';
  return {
    selected: other ? [...known, 'Other'] : known,
    other,
  };
};

const Section = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-soft border border-sand/50 mb-8">
    <h2 className="text-2xl font-display font-bold text-forest mb-6 flex items-center border-l-4 border-sage pl-4">
      {icon}
      <span className="ml-3">{title}</span>
    </h2>
    {children}
  </div>
);

const CompletePatientProfile = ({ auth, onAuthUpdate }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', // Added for pre-filling
    lastName: '',  // Added for pre-filling
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    occupation: '',
    otherOccupation: '',
    existingHealthConditions: [],
    otherHealthCondition: '',
    allergies: [],
    otherAllergy: '',
    medicineAllergySpecification: '',
    previousTreatments: [],
    otherPreviousTreatment: '',
  });

  const [age, setAge] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Set to true initially for loading data
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const response = await api.get('/patient/profile');
        const patient = response.data;

        // Format date for input type="date"
        const formattedDateOfBirth = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '';
        const healthConditions = splitKnownAndOther(patient.healthConditions, HEALTH_CONDITIONS);
        const allergies = splitKnownAndOther(patient.allergies, ALLERGIES);
        const previousTreatments = splitKnownAndOther(patient.previousTreatments, PREVIOUS_TREATMENTS);
        const knownOccupation = OCCUPATIONS.includes(patient.occupation);

        setFormData(prev => ({
          ...prev,
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          dateOfBirth: formattedDateOfBirth,
          gender: patient.gender || '',
          height: patient.height || '',
          weight: patient.weight || '',
          occupation: knownOccupation ? patient.occupation : patient.occupation ? 'Other' : '',
          otherOccupation: knownOccupation ? '' : patient.occupation || '',
          existingHealthConditions: healthConditions.selected,
          otherHealthCondition: healthConditions.other,
          allergies: allergies.selected,
          otherAllergy: allergies.other,
          medicineAllergySpecification:
            patient.allergies?.find((allergy) => allergy?.name === 'Medicine / Drug Allergy')?.specification || '',
          previousTreatments: previousTreatments.selected,
          otherPreviousTreatment: previousTreatments.other,
        }));
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile data.';
        setError(errorMessage);
        alert(`Error fetching profile: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientProfile();
  }, []); // Run once on component mount

  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        years--;
      }
      setAge(years);
    } else {
      setAge(null);
    }
  }, [formData.dateOfBirth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMultiSelectChange = (e, fieldName) => {
    const { options } = e.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const existingHealthConditions = formData.existingHealthConditions
        .filter((condition) => condition !== 'Other')
        .concat(formData.existingHealthConditions.includes('Other') && formData.otherHealthCondition.trim()
          ? [formData.otherHealthCondition.trim()]
          : []);
      const allergies = formData.allergies
        .filter((allergy) => allergy !== 'Other')
        .concat(formData.allergies.includes('Other') && formData.otherAllergy.trim()
          ? [formData.otherAllergy.trim()]
          : []);
      const previousTreatments = formData.previousTreatments
        .filter((treatment) => treatment !== 'Other')
        .concat(formData.previousTreatments.includes('Other') && formData.otherPreviousTreatment.trim()
          ? [formData.otherPreviousTreatment.trim()]
          : []);

      const payload = {
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        height: formData.height === '' ? null : Number(formData.height),
        weight: formData.weight === '' ? null : Number(formData.weight),
        occupation: formData.occupation === 'Other' ? formData.otherOccupation.trim() : formData.occupation,
        existingHealthConditions,
        allergies,
        medicineAllergySpecification: formData.medicineAllergySpecification.trim(),
        previousTreatments,
      };

      // Clean up payload: remove nulls and NaN, but keep valid empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || (typeof payload[key] === 'number' && Number.isNaN(payload[key]))) {
          delete payload[key];
        }
        // For arrays, if they are empty, send an empty array rather than deleting the key
        if (Array.isArray(payload[key]) && payload[key].length === 0) {
          // Keep the empty array, do not delete the key
        }
      });
      
      const response = await api.put('/patient/profile', payload);

      if (response.status === 200) {
        // Assuming the backend returns the updated patient object,
        // and it sets profileCompleted to true if all required fields are met.
        // We can check response.data.profileCompleted if available.
        onAuthUpdate({ profileCompleted: true }); // Update auth context
        navigate('/dashboard/patient'); // Navigate to patient dashboard
      } else {
        throw new Error('Failed to save profile. Please try again.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'mt-1 block w-full rounded-md border-sand bg-cream/50 shadow-sm focus:border-sage focus:ring focus:ring-sage focus:ring-opacity-50 transition-colors duration-300 disabled:opacity-50';
  const labelClass = 'block text-sm font-medium text-forest mb-1';

  return (
    <div className="min-h-screen bg-hero font-body text-forest">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-5xl font-display font-bold text-forest">
              Complete Your Profile
            </h1>
            <p className="mt-2 text-lg text-forest/80">
              Please provide your details to help us serve you better.
            </p>
          </header>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              {/* Left Column */}
              <div>
                <Section title="Personal Information" icon={<User className="text-sage" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="dateOfBirth" className={labelClass}>
                        Date of Birth
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="dateOfBirth"
                          id="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          disabled={isLoading}
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-sand" size={20} />
                      </div>
                      {age !== null && <p className="mt-2 text-sm text-forest">Your age: {age} years</p>}
                    </div>

                    <div>
                      <label htmlFor="gender" className={labelClass}>
                        Gender
                      </label>
                      <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className={inputClass} disabled={isLoading}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="occupation" className={labelClass}>
                        Occupation
                      </label>
                      <select name="occupation" id="occupation" value={formData.occupation} onChange={handleChange} className={inputClass} disabled={isLoading}>
                        <option value="">Select...</option>
                        <option value="Student">Student</option>
                        <option value="Employee">Employee</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Business">Business</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Homemaker">Homemaker</option>
                        <option value="Farmer">Farmer</option>
                        <option value="Retired">Retired</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="height" className={labelClass}>
                        Height (cm)
                      </label>
                      <input type="number" name="height" id="height" value={formData.height} onChange={handleChange} className={inputClass} disabled={isLoading} />
                    </div>

                    <div>
                      <label htmlFor="weight" className={labelClass}>
                        Weight (kg)
                      </label>
                      <input type="number" name="weight" id="weight" value={formData.weight} onChange={handleChange} className={inputClass} disabled={isLoading} />
                    </div>

                    {formData.occupation === 'Other' && (
                      <div className="sm:col-span-2">
                        <label htmlFor="otherOccupation" className={labelClass}>
                          Please specify your occupation
                        </label>
                        <input
                          type="text"
                          name="otherOccupation"
                          id="otherOccupation"
                          value={formData.otherOccupation}
                          onChange={handleChange}
                          placeholder="e.g., Artist"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                </Section>

                <Section title="Previous Treatments" icon={<Activity className="text-sage" />}>
                  <div>
                    <label htmlFor="previousTreatments" className={labelClass}>
                      Have you had any of these treatments before?
                    </label>
                    <select
                      multiple
                      name="previousTreatments"
                      id="previousTreatments"
                      value={formData.previousTreatments}
                      onChange={(e) => handleMultiSelectChange(e, 'previousTreatments')}
                      className={`${inputClass} h-40`}
                      disabled={isLoading}
                    >
                      <option value="No Previous Treatment">No Previous Treatment</option>
                      <option value="Ayurveda Treatment">Ayurveda Treatment</option>
                      <option value="Panchakarma Treatment">Panchakarma Treatment</option>
                      <option value="Allopathic / Modern Medicine Treatment">Allopathic / Modern Medicine Treatment</option>
                      <option value="Homeopathy Treatment">Homeopathy Treatment</option>
                      <option value="Siddha Treatment">Siddha Treatment</option>
                      <option value="Physiotherapy">Physiotherapy</option>
                      <option value="Surgery">Surgery</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.previousTreatments.includes('Other') && (
                      <div className="mt-4">
                        <label htmlFor="otherPreviousTreatment" className={labelClass}>
                          Please specify other treatment
                        </label>
                        <input
                          type="text"
                          name="otherPreviousTreatment"
                          id="otherPreviousTreatment"
                          value={formData.otherPreviousTreatment}
                          onChange={handleChange}
                          placeholder="e.g., Acupuncture"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                </Section>
              </div>

              {/* Right Column */}
              <div>
                <Section title="Health Conditions" icon={<Heart className="text-sage" />}>
                  <div>
                    <label htmlFor="existingHealthConditions" className={labelClass}>
                      Do you have any of the following?
                    </label>
                    <select
                      multiple
                      name="existingHealthConditions"
                      id="existingHealthConditions"
                      value={formData.existingHealthConditions}
                      onChange={(e) => handleMultiSelectChange(e, 'existingHealthConditions')}
                      className={`${inputClass} h-40`}
                      disabled={isLoading}
                    >
                      <option value="None">None</option>
                      <option value="Diabetes">Diabetes</option>
                      <option value="High Blood Pressure / Hypertension">High Blood Pressure / Hypertension</option>
                      <option value="Low Blood Pressure">Low Blood Pressure</option>
                      <option value="Asthma">Asthma</option>
                      <option value="Thyroid Disorder">Thyroid Disorder</option>
                      <option value="Arthritis">Arthritis</option>
                      <option value="Heart Disease">Heart Disease</option>
                      <option value="Migraine">Migraine</option>
                      <option value="Digestive Disorder">Digestive Disorder</option>
                      <option value="Skin Disorder">Skin Disorder</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.existingHealthConditions.includes('Other') && (
                      <div className="mt-4">
                        <label htmlFor="otherHealthCondition" className={labelClass}>
                          Please specify other condition
                        </label>
                        <input
                          type="text"
                          name="otherHealthCondition"
                          id="otherHealthCondition"
                          value={formData.otherHealthCondition}
                          onChange={handleChange}
                          placeholder="e.g., Chronic Fatigue"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                </Section>

                <Section title="Allergies" icon={<Shield className="text-sage" />}>
                  <div>
                    <label htmlFor="allergies" className={labelClass}>
                      Do you have any known allergies?
                    </label>
                    <select
                      multiple
                      name="allergies"
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleMultiSelectChange(e, 'allergies')}
                      className={`${inputClass} h-40`}
                      disabled={isLoading}
                    >
                      <option value="None">None</option>
                      <option value="Dust Allergy">Dust Allergy</option>
                      <option value="Pollen Allergy">Pollen Allergy</option>
                      <option value="Food Allergy">Food Allergy</option>
                      <option value="Dairy Allergy">Dairy Allergy</option>
                      <option value="Nut Allergy">Nut Allergy</option>
                      <option value="Seafood Allergy">Seafood Allergy</option>
                      <option value="Medicine / Drug Allergy">Medicine / Drug Allergy</option>
                      <option value="Skin Allergy">Skin Allergy</option>
                      <option value="Latex Allergy">Latex Allergy</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.allergies.includes('Medicine / Drug Allergy') && (
                      <div className="mt-4">
                        <label htmlFor="medicineAllergySpecification" className={labelClass}>
                          Please specify the medicine or drug allergy
                        </label>
                        <input
                          type="text"
                          name="medicineAllergySpecification"
                          id="medicineAllergySpecification"
                          value={formData.medicineAllergySpecification}
                          onChange={handleChange}
                          placeholder="e.g., Penicillin"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                    {formData.allergies.includes('Other') && (
                      <div className="mt-4">
                        <label htmlFor="otherAllergy" className={labelClass}>
                          Please specify other allergy
                        </label>
                        <input
                          type="text"
                          name="otherAllergy"
                          id="otherAllergy"
                          value={formData.otherAllergy}
                          onChange={handleChange}
                          placeholder="e.g., Animal dander"
                          className={inputClass}
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                </Section>
              </div>
            </div>

            {error && (
              <div className="mt-4 text-center text-red-500 bg-red-100 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-xl font-display font-bold text-white bg-sage hover:bg-leaf focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage transition-all duration-300 transform hover:scale-105 disabled:bg-leaf/50 disabled:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save and Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompletePatientProfile;