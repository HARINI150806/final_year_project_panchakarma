import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  User,
  Activity,
  ClipboardList,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Check,
  Users,
  Info,
} from 'lucide-react';
import api from '../api';

export default function TreatmentJourneyTimeline() {
  const [journeyData, setJourneyData] = useState(null);
  const [activeCycleNumber, setActiveCycleNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchJourney = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/patient/treatment-journey').catch(() => null);
      if (res && res.data && res.data.hasActiveJourney && Array.isArray(res.data.cycles) && res.data.cycles.length > 0) {
        setJourneyData(res.data);
        const currentCycleNum = res.data.activeCycleNumber || res.data.cycles[res.data.cycles.length - 1].cycleNumber;
        setActiveCycleNumber(currentCycleNum);
      } else {
        setJourneyData({ hasActiveJourney: false, cycles: [], nodes: [] });
      }
    } catch (err) {
      console.error('Failed to fetch treatment journey:', err);
      setJourneyData({ hasActiveJourney: false, cycles: [], nodes: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-emerald-900/10 bg-white p-8">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-emerald-700" />
          <p className="text-sm font-medium text-gray-600">Loading Treatment Journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertCircle className="mx-auto mb-2" size={24} />
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchJourney}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const rawCycles = journeyData?.cycles || [];
  const isLast = Boolean(journeyData?.isLastJourney);
  const cycles = rawCycles;
  const hasActiveJourney = Boolean(journeyData?.hasActiveJourney) && cycles.length > 0;

  if (!hasActiveJourney) {
    return (
      <div className="rounded-3xl border border-emerald-900/10 bg-white p-8 md:p-12 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 mb-4 border border-emerald-100">
          <Info size={32} />
        </div>
        <h2 className="font-display text-xl font-bold text-[#163322]">
          No Treatment Journey Found
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto leading-relaxed font-medium">
          A treatment journey will be created once you book a consultation with therapy and a therapist prescribes your plan.
        </p>
        <button
          onClick={() => navigate('/book-session')}
          className="mt-6 rounded-2xl bg-[#164E3D] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#113f31] transition cursor-pointer"
        >
          Book Consultation & Therapy
        </button>
      </div>
    );
  }

  const activeCycle = cycles.find((c) => c.cycleNumber === activeCycleNumber) || cycles[cycles.length - 1] || { nodes: [] };
  const nodes = activeCycle.nodes || [];
  const progressPercent = activeCycle.progressPercent ?? journeyData?.progressPercent ?? 0;
  const dominantDosha = journeyData?.dominantDosha ? String(journeyData.dominantDosha).replace('_', '-') : null;
  const hasDoshaAssessed = Boolean(dominantDosha);

  const getNodeIcon = (type, isActive) => {
    const bgClass = isActive ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-700';

    switch (type) {
      case 'CONSULTATION':
        return (
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${bgClass}`}>
            <Users size={20} />
          </div>
        );
      case 'THERAPY_PLAN':
        return (
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${bgClass}`}>
            <ClipboardList size={20} />
          </div>
        );
      case 'THERAPY_PROGRESS':
        return (
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${bgClass}`}>
            <Activity size={20} />
          </div>
        );
      case 'FOLLOWUP':
        return (
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${bgClass}`}>
            <Calendar size={20} />
          </div>
        );
      case 'RECOVERY':
        return (
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${bgClass}`}>
            <ShieldCheck size={20} />
          </div>
        );
      default:
        return (
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${bgClass}`}>
            <Sparkles size={20} />
          </div>
        );
    }
  };

  const gridColsClass = nodes.length === 4 
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
    : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5';

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-[#163322]">
                Treatment Journey
              </h1>
              {isLast && (
                <span className="rounded-full bg-amber-100 border border-amber-200 px-3 py-0.5 text-xs font-bold text-amber-900">
                  Last Completed Journey
                </span>
              )}
            </div>
            <p className="mt-1 text-xs md:text-sm text-gray-500 font-medium">
              {isLast
                ? 'Showing your last completed treatment journey. Book a new consultation with therapy to start a new cycle.'
                : 'Active treatment process & clinical milestone timeline'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isLast && (
              <button
                onClick={() => navigate('/book-session')}
                className="rounded-xl bg-[#164E3D] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#113f31] transition cursor-pointer"
              >
                + Book New Consultation
              </button>
            )}

            {/* Cycle Selector Tabs */}
            {cycles.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                {cycles.map((c) => {
                  const isSelected = c.cycleNumber === activeCycleNumber;
                  return (
                    <button
                      key={c.cycleNumber}
                      onClick={() => setActiveCycleNumber(c.cycleNumber)}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer shrink-0 border ${
                        isSelected
                          ? 'bg-[#164E3D] text-white border-[#164E3D] shadow-xs font-bold'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {c.displayTitle || c.cycleName} {c.isCurrentCycle ? '[In Progress]' : '[Completed]'}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-bold text-[#163322] mb-2">
            <span>Overall Treatment Progress</span>
            <span className="text-[#164E3D]">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#16A34A] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper Timeline & Milestone Cards Container */}
      <div className="relative pt-6">
        {/* Horizontal Connecting Line */}
        <div className="hidden lg:block absolute top-[27px] left-[10%] right-[10%] z-0">
          <div className="h-0.5 w-full bg-emerald-600/80" />
        </div>

        {/* Stepper Circles Row */}
        <div className={`hidden lg:grid ${gridColsClass} gap-4 relative z-10 mb-5`}>
          {nodes.map((node) => {
            const isActive = node.isCurrentActive || node.status === 'ACTIVE';
            const isPending = node.status === 'PENDING' || (node.therapyName && node.therapyName.toLowerCase().includes('pending'));
            const isDone = !isPending && (node.status === 'COMPLETED' || node.status === 'PLANNED' || node.status === 'PRESCRIBED' || node.status === 'BOOKED');

            return (
              <div key={`stepper-${node.id}`} className="flex justify-center">
                {isDone ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                    <Check size={14} strokeWidth={3} />
                  </div>
                ) : isActive ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-blue-600 shadow-xs relative">
                    <div className="h-3 w-3 rounded-full bg-blue-600 animate-ping" />
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-600 absolute" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 border border-gray-300 text-gray-400 shadow-xs">
                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Milestone Cards Grid */}
        <div className={`grid ${gridColsClass} gap-4`}>
          {nodes.map((node) => {
            const isActive = node.isCurrentActive;
            const isDone = node.status === 'COMPLETED' || node.status === 'PLANNED' || node.status === 'PRESCRIBED' || node.status === 'BOOKED';

            let cardBorder = 'border-gray-100 bg-white shadow-xs';
            if (isActive) {
              cardBorder = 'border-2 border-blue-500 bg-white shadow-md ring-2 ring-blue-400/20';
            }

            return (
              <div
                key={node.id}
                className={`rounded-[24px] border p-5 transition-all duration-200 flex flex-col justify-between space-y-4 ${cardBorder}`}
              >
                {/* Top Header: Icon, Title, Status Badge */}
                <div className="flex flex-col items-center text-center space-y-2">
                  {getNodeIcon(node.type, isActive)}

                  <h3 className="font-bold text-gray-900 text-sm">{node.title}</h3>

                  {node.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      <Check size={12} strokeWidth={3} />
                      Completed
                    </span>
                  ) : node.status === 'ACTIVE' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                      Active
                    </span>
                  ) : node.status === 'BOOKED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <Check size={12} strokeWidth={3} />
                      Booked
                    </span>
                  ) : node.status === 'PLANNED' || node.status === 'PRESCRIBED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      Prescribed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                      {node.type === 'FOLLOWUP' ? 'Scheduled' : 'Pending'}
                    </span>
                  )}
                </div>

                {/* CARD 1: CONSULTATION */}
                {node.type === 'CONSULTATION' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100/80 text-xs">
                    <div className="space-y-1.5 text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 shrink-0" />
                        <span>Date: <strong>{node.date || '12 Sep 2026'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400 shrink-0" />
                        <span>Time: <strong>{node.time || '10:30 AM'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800">Doctor: <strong>{node.assignedTherapist || 'Doctor'}</strong></span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-emerald-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-emerald-900 border border-emerald-100">
                      <span>Status</span>
                      <span className="font-bold text-emerald-700">{node.status === 'COMPLETED' ? 'Completed' : 'Active'}</span>
                    </div>
                  </div>
                )}

                {/* CARD 2: THERAPY CARD / THERAPY PLAN */}
                {node.type === 'THERAPY_PLAN' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100/80 text-xs">
                    <div className="space-y-1.5 text-gray-600 font-medium">
                      <p className="font-bold text-gray-900 text-xs text-center border-b border-gray-100 pb-1">
                        {node.therapyName || 'Pending Recommendation'}
                      </p>
                      <div className="flex items-center gap-2">
                        <ClipboardList size={14} className="text-gray-400 shrink-0" />
                        <span>Sessions: <strong>{node.totalSessions > 0 ? `${node.totalSessions} Sessions` : '--'}</strong></span>
                      </div>
                      {node.planCreatedDate && node.planCreatedDate !== '--' && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400 shrink-0" />
                          <span>{node.status === 'PRESCRIBED' || node.status === 'PLANNED' ? 'Prescribed Date:' : 'Booking Date:'} <strong>{node.planCreatedDate}</strong></span>
                        </div>
                      )}
                      {node.firstSessionDate && node.firstSessionDate !== '--' && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-emerald-600 shrink-0" />
                          <span>First Session: <strong>{node.firstSessionDate}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800">Specialist: <strong>{node.assignedTherapist || 'Assigned Specialist'}</strong></span>
                      </div>
                    </div>

                    {node.status === 'COMPLETED' ? (
                      <div className="rounded-xl bg-emerald-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-emerald-900 border border-emerald-100">
                        <span>Status</span>
                        <span className="font-bold text-emerald-700">Completed</span>
                      </div>
                    ) : node.status === 'BOOKED' || node.status === 'ACTIVE' ? (
                      <div className="rounded-xl bg-emerald-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-emerald-900 border border-emerald-100">
                        <span>Status</span>
                        <span className="font-bold text-emerald-700">Booked</span>
                      </div>
                    ) : node.status === 'PLANNED' || node.status === 'PRESCRIBED' ? (
                      <div className="rounded-xl bg-amber-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-amber-950 border border-amber-200">
                        <span>Status</span>
                        <span className="font-bold text-amber-800">Prescribed</span>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-gray-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-gray-700 border border-gray-200">
                        <span>Status</span>
                        <span className="font-bold text-gray-600">Pending</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CARD 3: THERAPY PROGRESS CARD */}
                {node.type === 'THERAPY_PROGRESS' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100/80 text-xs">
                    <div className="text-center space-y-1.5">
                      <p className="font-bold text-[#163322] text-xs">
                        {node.therapyName || 'Pending Therapy'}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-800">
                        {node.totalSessions > 0 ? `${node.completedSessions || 0} / ${node.totalSessions} Sessions Completed` : '0 / 0 Sessions Completed'}
                      </p>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#16A34A] transition-all duration-500"
                          style={{ width: `${node.totalSessions > 0 ? Math.round(((node.completedSessions || 0) / node.totalSessions) * 100) : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px] pt-1">
                      {node.latestCompletedSessionDate && (
                        <div>
                          <p className="font-bold text-gray-700">Last Session</p>
                          <div className="flex items-center gap-1.5 text-gray-600 mt-0.5">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span>{node.latestCompletedSessionDate} {node.latestCompletedSessionTime ? `• ${node.latestCompletedSessionTime}` : ''}</span>
                          </div>
                        </div>
                      )}

                      {node.nextScheduledSessionDate && (node.completedSessions || 0) < (node.totalSessions || 0) && (
                        <div>
                          <p className="font-bold text-emerald-800">Next Session</p>
                          <div className="flex items-center gap-1.5 text-emerald-900 font-semibold mt-0.5">
                            <Calendar size={13} className="text-emerald-600 shrink-0" />
                            <span>{node.nextScheduledSessionDate} {node.nextScheduledSessionTime ? `• ${node.nextScheduledSessionTime}` : ''}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        <User size={13} className="text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800">Specialist: <strong>{node.assignedTherapist || 'Assigned Specialist'}</strong></span>
                      </div>
                    </div>

                    {node.status === 'COMPLETED' ? (
                      <div className="rounded-xl bg-emerald-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-emerald-900 border border-emerald-100">
                        <span>Status</span>
                        <span className="font-bold text-emerald-700">Completed</span>
                      </div>
                    ) : node.status === 'ACTIVE' && (node.completedSessions || 0) > 0 ? (
                      <div className="rounded-xl bg-blue-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-blue-900 border border-blue-100">
                        <span>Status</span>
                        <span className="font-bold text-blue-700">In Progress</span>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-gray-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-gray-700 border border-gray-200">
                        <span>Status</span>
                        <span className="font-bold text-gray-600">Pending</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CARD 4: FOLLOW-UP CONSULTATION CARD (ONLY IF SCHEDULED) */}
                {node.type === 'FOLLOWUP' && (
                  <div className="space-y-3 pt-2 border-t border-gray-100/80 text-xs">
                    <div className="space-y-1.5 text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400 shrink-0" />
                        <span>Follow-up Date: <strong>{node.date || '28 Sep 2026'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400 shrink-0" />
                        <span>Follow-up Time: <strong>{node.time || '11:00 AM'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800">Therapist: <strong>{node.assignedTherapist || 'Dr. Harini'}</strong></span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-emerald-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-emerald-900 border border-emerald-100">
                      <span>Status</span>
                      <span className="font-bold text-emerald-700">{node.status === 'COMPLETED' ? 'Completed' : 'Scheduled'}</span>
                    </div>
                  </div>
                )}

                {/* CARD 5: RECOVERY ASSESSMENT CARD */}
                {node.type === 'RECOVERY' && (() => {
                  const hasEvaluated = Boolean(
                    (node.currentRecoveryPercent != null && node.currentRecoveryPercent > 0) ||
                    (node.predictedRecoveryPercent != null && node.predictedRecoveryPercent > 0) ||
                    node.therapistRemarks ||
                    node.hasAssessment ||
                    (node.status === 'COMPLETED' && node.currentRecoveryPercent != null)
                  );

                  return (
                    <div className="space-y-3 pt-2 border-t border-gray-100/80 text-xs">
                      {hasEvaluated ? (
                        <div className="space-y-2 text-gray-600 font-medium">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col items-center bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100/80">
                              <span className="text-[10px] uppercase font-bold text-emerald-800">Current Recovery</span>
                              <span className="font-black text-emerald-900 text-base mt-0.5">{node.currentRecoveryPercent ?? 0}%</span>
                            </div>
                            <div className="flex flex-col items-center bg-amber-50/80 p-2.5 rounded-xl border border-amber-100/80">
                              <span className="text-[10px] uppercase font-bold text-amber-800">XGBoost Predicted</span>
                              <span className="font-black text-amber-900 text-base mt-0.5">{node.predictedRecoveryPercent ?? 0}%</span>
                            </div>
                          </div>

                          {node.therapistRemarks && (
                            <div className="pt-1 text-[11px] text-gray-600 italic bg-gray-50 p-2 rounded-xl border border-gray-100">
                              "{node.therapistRemarks}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200/70 text-center text-xs text-amber-900">
                          <p className="font-bold text-[11px]">Assessment & Prediction Pending</p>
                          <p className="text-[10px] text-amber-800/80 mt-0.5">Therapist will evaluate recovery during session.</p>
                        </div>
                      )}

                      {node.status === 'COMPLETED' && hasEvaluated ? (
                        <div className="rounded-xl bg-emerald-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-emerald-900 border border-emerald-100">
                          <span>Status</span>
                          <span className="font-bold text-emerald-700">Completed</span>
                        </div>
                      ) : node.status === 'ACTIVE' && hasEvaluated ? (
                        <div className="rounded-xl bg-emerald-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-emerald-900 border border-emerald-100">
                          <span>Status</span>
                          <span className="font-bold text-emerald-700">{node.recoveryStatus || 'Improving'}</span>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-gray-50/80 p-2.5 flex items-center justify-between text-[11px] font-semibold text-gray-700 border border-gray-200">
                          <span>Status</span>
                          <span className="font-bold text-gray-600">Pending</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
