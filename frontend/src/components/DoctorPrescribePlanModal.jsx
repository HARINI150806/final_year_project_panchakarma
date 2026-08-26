import ClinicalPrescriptionFormModal from './ClinicalPrescriptionFormModal';

export default function DoctorPrescribePlanModal({ isOpen, onClose, preselectedPatient, onSuccess }) {
  return (
    <ClinicalPrescriptionFormModal
      isOpen={isOpen}
      onClose={onClose}
      patientData={preselectedPatient}
      onSuccess={onSuccess}
    />
  );
}
