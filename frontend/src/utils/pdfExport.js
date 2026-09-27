import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { doshaDietRecommendations } from '../data';

/**
 * Generates an official Ayurvedic Dosha Assessment & Health Certificate PDF.
 */
export async function generateDoshaCertificatePDF(data) {
  const {
    patientName = 'Valued Patient',
    patientEmail = '',
    primaryDosha = 'Vata-Pitta',
    prakritiDetails = '',
    vataScore = 35,
    pittaScore = 45,
    kaphaScore = 20,
    recommendations = {},
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } = data;

  const normalizedKey = (primaryDosha || 'VATA').toUpperCase().replace('-', '_').replace(' ', '_');
  const diet = doshaDietRecommendations[normalizedKey] || doshaDietRecommendations.VATA;

  // Create a temporary hidden container formatted for A4 printing
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px'; // A4 width in pixels at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'serif, system-ui, sans-serif';
  container.style.color = '#065f46';
  container.style.padding = '40px';

  container.innerHTML = `
    <div style="border: 2px solid #065f46; padding: 24px; border-radius: 12px; background: #fffdf9;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px double #d97706; padding-bottom: 16px; margin-bottom: 24px;">
        <div style="font-size: 24px; font-weight: bold; color: #065f46; letter-spacing: 1px;">🌿 AYURVEDIC PANCHAKARMA CLINIC</div>
        <div style="font-size: 13px; color: #b45309; margin-top: 4px; font-style: italic;">Center for Authentic Panchakarma & Holistic Health</div>
        <div style="font-size: 11px; color: #4b5563; margin-top: 2px;">Official Prakriti Assessment & Dosha Diagnosis Report</div>
      </div>

      <!-- Patient & Dosha Header -->
      <div style="display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div>
          <div style="font-size: 12px; text-transform: uppercase; color: #047857; font-weight: bold;">Patient Name</div>
          <div style="font-size: 18px; font-weight: bold; color: #064e3b; margin-top: 2px;">${patientName}</div>
          <div style="font-size: 11px; color: #047857; margin-top: 4px;">${patientEmail}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #047857;">Assessment Date</div>
          <div style="font-size: 13px; font-weight: bold; color: #064e3b; margin-top: 2px;">${date}</div>
          <div style="font-size: 10px; color: #059669; margin-top: 4px;">ID: PK-DOSHA-${Math.floor(1000 + Math.random() * 9000)}</div>
        </div>
      </div>

      <!-- Main Result Card -->
      <div style="background: linear-gradient(135deg, #15803d 0%, #065f46 100%); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="font-size: 12px; text-transform: uppercase; tracking: 2px; color: #fef3c7;">Dominant Constitutional Type (Prakriti)</div>
        <div style="font-size: 26px; font-weight: bold; margin-top: 4px;">${primaryDosha} Prakriti</div>
        <div style="font-size: 12px; color: #dcfce7; margin-top: 6px; font-style: italic;">
          ${prakritiDetails || 'Unique mind-body blueprint diagnosed via clinical assessment parameters.'}
        </div>
      </div>

      <!-- Dosha Score Breakdown -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: bold; color: #065f46; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          📊 CONSTITUTIONAL DOSHA RATIO BREAKDOWN
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1; background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; font-weight: bold; color: #0369a1;">VATA (Air & Space)</div>
            <div style="font-size: 22px; font-weight: bold; color: #0284c7; margin-top: 4px;">${vataScore}%</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Governs Movement & Mind</div>
          </div>
          <div style="flex: 1; background: #fff7ed; border: 1px solid #fed7aa; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; font-weight: bold; color: #c2410c;">PITTA (Fire & Water)</div>
            <div style="font-size: 22px; font-weight: bold; color: #ea580c; margin-top: 4px;">${pittaScore}%</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Governs Metabolism & Digestion</div>
          </div>
          <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; font-weight: bold; color: #166534;">KAPHA (Earth & Water)</div>
            <div style="font-size: 22px; font-weight: bold; color: #15803d; margin-top: 4px;">${kaphaScore}%</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Governs Structure & Immunity</div>
          </div>
        </div>
      </div>

      <!-- Pathya / Apathya Recommendations -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; background: #f0fdf4; border: 1px solid #86efac; padding: 14px; border-radius: 8px;">
          <div style="font-size: 13px; font-weight: bold; color: #166534; margin-bottom: 8px;">✅ Pathya Ahara (${diet.doshaName} Favorable Foods)</div>
          <ul style="font-size: 11px; color: #14532d; padding-left: 16px; margin: 0; line-height: 1.6;">
            ${diet.pathya.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        <div style="flex: 1; background: #fef2f2; border: 1px solid #fca5a5; padding: 14px; border-radius: 8px;">
          <div style="font-size: 13px; font-weight: bold; color: #991b1b; margin-bottom: 8px;">🚫 Apathya (Foods to Avoid for ${diet.doshaName})</div>
          <ul style="font-size: 11px; color: #7f1d1d; padding-left: 16px; margin: 0; line-height: 1.6;">
            ${diet.apathya.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Prescribed Herbal Regimen -->
      <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; margin-bottom: 28px;">
        <div style="font-size: 13px; font-weight: bold; color: #92400e; margin-bottom: 6px;">💊 Recommended Herbal Formulations & Oils</div>
        <p style="font-size: 11px; color: #78350f; line-height: 1.5; margin: 0;">
          Triphala Churna (1 tsp at bedtime with warm water), Ashwagandha Arishta (15ml after meals), Dhanwantaram Thailam for daily warm Abhyanga self-massage prior to bathing.
        </p>
      </div>

      <!-- Doctor Signature & Watermark Footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 11px; color: #475569;">
        <div>
          <p style="margin: 0; font-weight: bold; color: #065f46;">Panchakarma Department</p>
          <p style="margin: 2px 0;">Ayurvedic Medical Board Approved</p>
        </div>
        <div style="text-align: center;">
          <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #065f46; margin-bottom: -4px;">Dr. V. K. Sharma, BAMS</div>
          <div style="border-top: 1px solid #475569; width: 140px; margin-top: 4px;"></div>
          <p style="margin: 2px 0; font-size: 10px;">Senior Vaidya Signature</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    pdf.save(`${patientName.replace(/\s+/g, '_')}_Dosha_Certificate.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generates an official Therapy Session / Package Booking Prescription & Receipt PDF.
 */
export async function generatePrescriptionPDF(booking) {
  const auth = JSON.parse(localStorage.getItem('panchakarma-auth') || '{}');

  const id = booking.id || booking.bookingId || 'N/A';
  const patientName =
    booking.patientName ||
    booking.patientFullName ||
    booking.patient?.fullName ||
    auth.fullName ||
    auth.name ||
    'Valued Patient';

  const therapistName =
    booking.therapistName ||
    booking.therapistFullName ||
    (booking.assignedTo ? (typeof booking.assignedTo === 'object' ? booking.assignedTo.fullName : booking.assignedTo) : null) ||
    'Attending Vaidya';

  const therapyName =
    booking.notes ||
    booking.purpose ||
    booking.therapyName ||
    (booking.type && booking.type !== 'THERAPY' && booking.type !== 'CONSULTATION' ? booking.type : 'Panchakarma Therapy Session');

  const date = booking.date || booking.bookingDate || new Date().toLocaleDateString();
  const time = booking.time || booking.bookingTime || '';
  const sessionNotes = booking.sessionNotes || '';
  const patientAdvice = booking.patientAdvice || '';
  const packageId = booking.packageId || null;
  const sessionNumber = booking.sessionNumber || null;
  const totalSessions = booking.totalSessions || null;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'serif, system-ui, sans-serif';
  container.style.color = '#065f46';
  container.style.padding = '40px';

  container.innerHTML = `
    <div style="border: 2px solid #065f46; padding: 24px; border-radius: 12px; background: #fffdf9;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; border-bottom: 2px double #d97706; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 22px; font-weight: bold; color: #065f46;">🌿 AYURVEDIC PANCHAKARMA CLINIC</div>
          <div style="font-size: 12px; color: #b45309; font-style: italic;">Official Clinical Prescription & Session Receipt</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: bold; color: #065f46;">Booking ID: #${id}</div>
          ${packageId ? `<div style="font-size: 11px; color: #d97706; font-weight: bold;">Package: ${packageId}</div>` : ''}
          <div style="font-size: 11px; color: #64748b;">Date: ${date} ${time || ''}</div>
        </div>
      </div>

      <!-- Patient & Doctor Card -->
      <div style="display: flex; gap: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
        <div style="flex: 1;">
          <p style="margin: 2px 0;"><strong>Patient:</strong> ${patientName}</p>
          <p style="margin: 2px 0;"><strong>Therapy:</strong> ${therapyName}</p>
        </div>
        <div style="flex: 1; border-left: 1px solid #cbd5e1; padding-left: 16px;">
          <p style="margin: 2px 0;"><strong>Attending Vaidya:</strong> ${therapistName}</p>
          ${totalSessions ? `<p style="margin: 2px 0; color: #065f46; font-weight: bold;">Session Track: Session ${sessionNumber || 1} of ${totalSessions}</p>` : ''}
        </div>
      </div>

      <!-- Clinical Notes & Prescription -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 14px; color: #065f46; border-left: 4px solid #d97706; padding-left: 8px; margin-bottom: 8px;">CLINICAL OBSERVATIONS & NOTES</h4>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 12px; min-height: 60px; line-height: 1.6;">
          ${sessionNotes || 'Patient scheduled for therapy session. Vital parameters checked prior to treatment.'}
        </div>
      </div>

      <!-- Patient Lifestyle & Dietary Advice -->
      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 14px; color: #065f46; border-left: 4px solid #10b981; padding-left: 8px; margin-bottom: 8px;">PRE & POST THERAPY ADVICE (PATHYA)</h4>
        <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 8px; font-size: 12px; line-height: 1.6;">
          ${patientAdvice || 'Consume warm water throughout the day. Avoid direct cold wind exposure and heavy meals immediately post session.'}
        </div>
      </div>

      <!-- Signature -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 11px; color: #475569;">
        <div>
          <p style="margin: 0; font-weight: bold;">Certified Panchakarma Center</p>
          <p style="margin: 2px 0; font-size: 10px;">Computer Generated Valid Electronic Record</p>
        </div>
        <div style="text-align: center;">
          <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 18px; color: #065f46;">${therapistName}</div>
          <div style="border-top: 1px solid #475569; width: 140px; margin-top: 4px;"></div>
          <p style="margin: 2px 0; font-size: 10px;">Attending Practitioner Signature</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    pdf.save(`Prescription_Booking_${id}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generates an official Therapy & Treatment Journey Clinical Progress Report PDF.
 */
export async function generateTherapyReportPDF(data) {
  const {
    patientName = 'Valued Patient',
    patientEmail = '',
    therapyName = 'Panchakarma Therapy',
    chiefComplaint = 'General Panchakarma Care',
    therapistName = 'Attending Vaidya',
    cycleName = 'Cycle 1',
    completedSessions = 0,
    totalSessions = 0,
    progressPercent = 0,
    currentRecovery = 'Pending',
    targetRecovery = 'Pending',
    dominantDosha = 'Prakriti Assessed',
    status = 'In Progress',
    date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    sessionHistory = [],
    nodes = []
  } = data;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'serif, system-ui, sans-serif';
  container.style.color = '#065f46';
  container.style.padding = '40px';

  const historyHtml = sessionHistory && sessionHistory.length > 0
    ? sessionHistory.map(s => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px; font-weight: bold; color: #064e3b;">Session ${s.sessionNumber || 1}</td>
        <td style="padding: 8px; color: #047857;">${s.currentRecoveryPercentage != null ? s.currentRecoveryPercentage + '%' : 'Completed'}</td>
        <td style="padding: 8px; color: #475569;">Pain: ${s.painLevel ?? 'N/A'}/10 | Sleep: ${s.sleepQuality ?? 'N/A'}/10</td>
        <td style="padding: 8px; color: #334155; font-style: italic;">"${s.remarks || 'Session completed successfully.'}"</td>
      </tr>
    `).join('')
    : `<tr><td colspan="4" style="padding: 12px; font-size: 11px; color: #64748b; text-align: center;">Therapy session tracking active. Detailed session logs record as sessions complete.</td></tr>`;

  const nodesHtml = nodes && nodes.length > 0
    ? nodes.map(n => `
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px; text-align: center;">
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #047857;">${n.title || n.type}</div>
        <div style="font-size: 12px; font-weight: bold; color: #064e3b; margin-top: 2px;">${n.status || 'Active'}</div>
        <div style="font-size: 9px; color: #059669; margin-top: 2px;">${n.date || ''}</div>
      </div>
    `).join('')
    : '';

  container.innerHTML = `
    <div style="border: 2px solid #065f46; padding: 24px; border-radius: 12px; background: #fffdf9;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px double #d97706; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="font-size: 24px; font-weight: bold; color: #065f46; letter-spacing: 1px;">🌿 AYURVEDIC PANCHAKARMA CLINIC</div>
        <div style="font-size: 13px; color: #b45309; margin-top: 4px; font-style: italic;">Official Therapy & Treatment Journey Progress Report</div>
        <div style="font-size: 11px; color: #4b5563; margin-top: 2px;">Generated on ${date}</div>
      </div>

      <!-- Patient & Therapy Information -->
      <div style="display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; color: #047857; font-weight: bold;">Patient Details</div>
          <div style="font-size: 16px; font-weight: bold; color: #064e3b; margin-top: 2px;">${patientName}</div>
          <div style="font-size: 11px; color: #047857; margin-top: 2px;">${patientEmail}</div>
          <div style="font-size: 11px; color: #d97706; font-weight: bold; margin-top: 4px;">Prakriti: ${dominantDosha}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; text-transform: uppercase; color: #047857; font-weight: bold;">Active Therapy</div>
          <div style="font-size: 16px; font-weight: bold; color: #064e3b; margin-top: 2px;">${therapyName}</div>
          <div style="font-size: 11px; color: #4b5563; margin-top: 2px;">Complaint: <strong>${chiefComplaint}</strong></div>
          <div style="font-size: 11px; color: #047857; margin-top: 2px;">Therapist: <strong>${therapistName}</strong></div>
        </div>
      </div>

      <!-- Key Clinical Metrics Banner -->
      <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <div style="flex: 1; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #047857;">Overall Journey Progress</div>
          <div style="font-size: 20px; font-weight: bold; color: #065f46; margin-top: 2px;">${progressPercent}%</div>
          <div style="font-size: 10px; color: #059669;">${status}</div>
        </div>
        <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #166534;">Completed Sessions</div>
          <div style="font-size: 20px; font-weight: bold; color: #15803d; margin-top: 2px;">${completedSessions} / ${totalSessions}</div>
          <div style="font-size: 10px; color: #166534;">${therapyName}</div>
        </div>
        <div style="flex: 1; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #c2410c;">Current Recovery</div>
          <div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-top: 2px;">${currentRecovery}${typeof currentRecovery === 'number' ? '%' : ''}</div>
          <div style="font-size: 10px; color: #9a3412;">Measured Index</div>
        </div>
        <div style="flex: 1; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #854d0e;">Target Recovery Goal</div>
          <div style="font-size: 20px; font-weight: bold; color: #ca8a04; margin-top: 2px;">${targetRecovery}${typeof targetRecovery === 'number' ? '%' : ''}</div>
          <div style="font-size: 10px; color: #713f12;">Clinical Benchmark</div>
        </div>
      </div>

      <!-- Treatment Journey Nodes Summary -->
      ${nodesHtml ? `
        <div style="margin-bottom: 20px;">
          <div style="font-size: 12px; font-weight: bold; color: #065f46; margin-bottom: 8px;">📍 TREATMENT JOURNEY STAGE MILESTONES</div>
          <div style="display: flex; gap: 8px;">
            ${nodesHtml}
          </div>
        </div>
      ` : ''}

      <!-- Session Evaluation History -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: bold; color: #065f46; margin-bottom: 8px;">📋 SESSION LOGS & CLINICAL EVALUATIONS</div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; background: #ffffff;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; font-size: 10px; color: #475569; text-align: left;">
              <th style="padding: 8px;">SESSION</th>
              <th style="padding: 8px;">RECOVERY %</th>
              <th style="padding: 8px;">PATIENT VITALS</th>
              <th style="padding: 8px;">THERAPIST REMARKS</th>
            </tr>
          </thead>
          <tbody>
            ${historyHtml}
          </tbody>
        </table>
      </div>

      <!-- Post-Treatment & Dietary Pathya -->
      <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 11px;">
        <div style="font-weight: bold; color: #166534; margin-bottom: 4px;">🌿 PRE & POST THERAPY AYURVEDIC PATHYA</div>
        <p style="margin: 0; color: #14532d; line-height: 1.5;">
          Maintain light Samsarjana Krama warm meals (Kichadi/Soup). Drink warm cumin water throughout therapy days and avoid heavy, fried, or cold foods.
        </p>
      </div>

      <!-- Footer Signature -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #cbd5e1; padding-top: 16px; font-size: 11px; color: #475569;">
        <div>
          <p style="margin: 0; font-weight: bold; color: #065f46;">Certified Panchakarma Department</p>
          <p style="margin: 2px 0; font-size: 10px;">Official Patient Health Record</p>
        </div>
        <div style="text-align: center;">
          <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 18px; color: #065f46;">${therapistName}</div>
          <div style="border-top: 1px solid #475569; width: 140px; margin-top: 4px;"></div>
          <p style="margin: 2px 0; font-size: 10px;">Attending Vaidya Signature</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    pdf.save(`${patientName.replace(/\s+/g, '_')}_Therapy_Report.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

