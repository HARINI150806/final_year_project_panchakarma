import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const NewComplaintPage = () => {
    const navigate = useNavigate();
    const [mainComplaint, setMainComplaint] = useState('');
    const [otherComplaint, setOtherComplaint] = useState('');
    const [symptoms, setSymptoms] = useState([]);
    const [otherSymptom, setOtherSymptom] = useState('');
    const [bodyArea, setBodyArea] = useState('');
    const [otherBodyArea, setOtherBodyArea] = useState('');
    const [severity, setSeverity] = useState('MILD');
    const [durationValue, setDurationValue] = useState('');
    const [durationUnit, setDurationUnit] = useState('DAYS');
    const [frequency, setFrequency] = useState('OCCASIONAL');
    const [painLevel, setPainLevel] = useState(1);
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    const mainComplaintMapping = {
        'Joint Pain': 'JOINT_PAIN',
        'Back Pain': 'BACK_PAIN',
        'Neck Pain': 'NECK_PAIN',
        'Headache / Migraine': 'HEADACHE_MIGRAINE',
        'Muscle Pain': 'MUSCLE_PAIN',
        'Body Stiffness': 'BODY_STIFFNESS',
        'Stress / Anxiety': 'STRESS_ANXIETY',
        'Sleep Problem': 'SLEEP_PROBLEM',
        'Digestive Problem': 'DIGESTIVE_PROBLEM',
        'Constipation': 'CONSTIPATION',
        'Acidity / Heartburn': 'ACIDITY_HEARTBURN',
        'Skin Problem': 'SKIN_PROBLEM',
        'Fatigue / Low Energy': 'FATIGUE_LOW_ENERGY',
        'Respiratory Problem': 'RESPIRATORY_PROBLEM',
        'Other': 'OTHER'
    };

    const mainComplaintOptions = Object.keys(mainComplaintMapping).map(label => ({
        label: label,
        value: mainComplaintMapping[label]
    }));

    const symptomMapping = {
        'Pain': 'PAIN',
        'Stiffness': 'STIFFNESS',
        'Swelling': 'SWELLING',
        'Difficulty Moving': 'DIFFICULTY_MOVING',
        'Reduced Flexibility': 'REDUCED_FLEXIBILITY',
        'Muscle Tightness': 'MUSCLE_TIGHTNESS',
        'Weakness': 'WEAKNESS',
        'Tiredness / Fatigue': 'TIREDNESS_FATIGUE',
        'Headache': 'HEADACHE',
        'Dizziness': 'DIZZINESS',
        'Poor Sleep': 'POOR_SLEEP',
        'Restlessness': 'RESTLESSNESS',
        'Stress': 'STRESS',
        'Bloating': 'BLOATING',
        'Gas': 'GAS',
        'Indigestion': 'INDIGESTION',
        'Nausea': 'NAUSEA',
        'Loss of Appetite': 'LOSS_OF_APPETITE',
        'Constipation': 'CONSTIPATION',
        'Acidity / Burning Sensation': 'ACIDITY_BURNING_SENSATION',
        'Itching': 'ITCHING',
        'Skin Dryness': 'SKIN_DRYNESS',
        'Skin Redness': 'SKIN_REDNESS',
        'Cough': 'COUGH',
        'Nasal Congestion': 'NASAL_CONGESTION',
        'Breathing Difficulty': 'BREATHING_DIFFICULTY',
        'Other': 'OTHER'
    };

    const symptomOptions = Object.keys(symptomMapping).map(label => ({
        label: label,
        value: symptomMapping[label]
    }));

    const bodyAreaMapping = {
        'Head': 'HEAD',
        'Neck': 'NECK',
        'Shoulder': 'SHOULDER',
        'Chest': 'CHEST',
        'Upper Back': 'UPPER_BACK',
        'Lower Back': 'LOWER_BACK',
        'Abdomen / Stomach': 'ABDOMEN_STOMACH',
        'Arm': 'ARM',
        'Elbow': 'ELBOW',
        'Wrist': 'WRIST',
        'Hand': 'HAND',
        'Hip': 'HIP',
        'Knee': 'KNEE',
        'Ankle': 'ANKLE',
        'Foot': 'FOOT',
        'Multiple Areas': 'MULTIPLE_AREAS',
        'Full Body': 'FULL_BODY',
        'Not Applicable': 'NOT_APPLICABLE',
        'Other': 'OTHER'
    };

    const bodyAreaOptions = Object.keys(bodyAreaMapping).map(label => ({
        label: label,
        value: bodyAreaMapping[label]
    }));

    const handleSymptomChange = (e) => {
        const { value, checked } = e.target;
        // Use the label to find the corresponding enum value for storage
        const enumValue = symptomMapping[value];
        if (checked) {
            setSymptoms([...symptoms, enumValue]);
        } else {
            setSymptoms(symptoms.filter(symptom => symptom !== enumValue));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!showSummary) {
            setShowSummary(true);
            return;
        }

        const complaintData = {
            mainComplaint,
            otherComplaint: mainComplaint === 'OTHER' ? otherComplaint : '',
            symptoms: symptoms.map(symptom => ({
                symptomName: symptom, // symptom is already the enum value
                otherSymptomDetails: symptom === 'OTHER' ? otherSymptom : ''
            })),
            bodyArea, // bodyArea is already the enum value
            otherBodyArea: bodyArea === 'OTHER' ? otherBodyArea : '',
            severity,
            durationValue: parseInt(durationValue),
            durationUnit,
            frequency,
            painLevel: painLevel === 'Not Applicable' ? null : parseInt(painLevel),
            additionalDetails
        };

        try {
            await api.post('/patient/complaints', complaintData);
            alert('Complaint submitted successfully!');
            navigate('/my-complaints');
        } catch (error) {
            console.error('Error submitting complaint:', error);
            alert('Failed to submit complaint.');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">New Complaint</h1>
            <form onSubmit={handleSubmit}>
                {/* Main Complaint */}
                <div className="mb-4">
                    <label className="block text-gray-700">Main Complaint</label>
                    <select value={mainComplaint} onChange={(e) => setMainComplaint(e.target.value)} className="w-full p-2 border rounded">
                        <option value="">Select a complaint</option>
                        {mainComplaintOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    {mainComplaint === 'Other' && (
                        <input type="text" value={otherComplaint} onChange={(e) => setOtherComplaint(e.target.value)} placeholder="Please specify your complaint" className="w-full p-2 border rounded mt-2" />
                    )}
                </div>

                {/* Symptoms */}
                <div className="mb-4">
                    <label className="block text-gray-700">Symptoms</label>
                    <div className="grid grid-cols-3 gap-2">
                        {symptomOptions.map(option => (
                            <label key={option.value} className="flex items-center">
                                <input type="checkbox" value={option.label} onChange={handleSymptomChange} className="mr-2" />
                                {option.label}
                            </label>
                        ))}
                    </div>
                    {symptoms.includes('Other') && (
                        <input type="text" value={otherSymptom} onChange={(e) => setOtherSymptom(e.target.value)} placeholder="Please specify other symptom" className="w-full p-2 border rounded mt-2" />
                    )}
                </div>

                {/* Body Area */}
                <div className="mb-4">
                    <label className="block text-gray-700">Body Area</label>
                    <select value={bodyArea} onChange={(e) => setBodyArea(bodyAreaMapping[e.target.value])} className="w-full p-2 border rounded">
                        <option value="">Select a body area</option>
                        {bodyAreaOptions.map(option => <option key={option.value} value={option.label}>{option.label}</option>)}
                    </select>
                    {bodyArea === 'Other' && (
                        <input type="text" value={otherBodyArea} onChange={(e) => setOtherBodyArea(e.target.value)} placeholder="Please specify the body area" className="w-full p-2 border rounded mt-2" />
                    )}
                </div>

                {/* Severity */}
                <div className="mb-4">
                    <label className="block text-gray-700">Severity</label>
                    <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full p-2 border rounded">
                        <option value="MILD">Mild</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="SEVERE">Severe</option>
                    </select>
                </div>

                {/* Duration */}
                <div className="mb-4">
                    <label className="block text-gray-700">Duration</label>
                    <div className="flex">
                        <input type="number" value={durationValue} onChange={(e) => setDurationValue(e.target.value)} className="w-1/2 p-2 border rounded-l" />
                        <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="w-1/2 p-2 border-t border-b border-r rounded-r">
                            <option value="DAYS">Days</option>
                            <option value="WEEKS">Weeks</option>
                            <option value="MONTHS">Months</option>
                            <option value="YEARS">Years</option>
                        </select>
                    </div>
                </div>

                {/* Frequency */}
                <div className="mb-4">
                    <label className="block text-gray-700">Frequency</label>
                    <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full p-2 border rounded">
                        <option value="OCCASIONAL">Occasional</option>
                        <option value="FREQUENT">Frequent</option>
                        <option value="DAILY">Daily</option>
                        <option value="CONTINUOUS">Continuous</option>
                    </select>
                </div>

                {/* Pain Level */}
                <div className="mb-4">
                    <label className="block text-gray-700">Pain Level (1-10)</label>
                    <input type="range" min="1" max="10" value={painLevel} onChange={(e) => setPainLevel(e.target.value)} className="w-full" />
                    <div className="flex justify-between text-xs">
                        <span>Very Mild Pain</span>
                        <span>Severe Pain</span>
                    </div>
                    <label className="flex items-center mt-2">
                        <input type="checkbox" onChange={(e) => setPainLevel(e.target.checked ? 'Not Applicable' : 1)} className="mr-2" />
                        Not Applicable
                    </label>
                </div>

                {/* Additional Details */}
                <div className="mb-4">
                    <label className="block text-gray-700">Additional Details</label>
                    <textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} className="w-full p-2 border rounded"></textarea>
                </div>

                {showSummary && (
                    <div className="p-4 border rounded bg-gray-50 mb-4">
                        <h2 className="text-xl font-bold mb-2">Complaint Summary</h2>
                        <p><strong>Main Complaint:</strong> {mainComplaint} {mainComplaint === 'Other' && `- ${otherComplaint}`}</p>
                        <p><strong>Symptoms:</strong> {symptoms.join(', ')} {symptoms.includes('Other') && `- ${otherSymptom}`}</p>
                        <p><strong>Body Area:</strong> {bodyArea} {bodyArea === 'Other' && `- ${otherBodyArea}`}</p>
                        <p><strong>Severity:</strong> {severity}</p>
                        <p><strong>Duration:</strong> {durationValue} {durationUnit}</p>
                        <p><strong>Frequency:</strong> {frequency}</p>
                        <p><strong>Pain Level:</strong> {painLevel}</p>
                        <p><strong>Additional Details:</strong> {additionalDetails}</p>
                        <button type="button" onClick={() => setShowSummary(false)} className="bg-gray-500 text-white px-4 py-2 rounded mt-4 mr-2">Edit Details</button>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">Submit Complaint</button>
                    </div>
                )}

                {!showSummary && (
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Review Complaint</button>
                )}
            </form>
        </div>
    );
};

export default NewComplaintPage;