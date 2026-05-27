import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getRoommateProfile, saveRoommateProfile, getRoommateMatches } from '../api/api.js';
import { Heart, Sparkles, MessageSquare, Edit2, Compass, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RoommateFinderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [setupRequired, setSetupRequired] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Quiz Form State
  const [step, setStep] = useState(1);
  const [sleepHabit, setSleepHabit] = useState('');
  const [studyHabit, setStudyHabit] = useState('');
  const [cleanliness, setCleanliness] = useState('');
  const [socialLevel, setSocialLevel] = useState('');
  const [bio, setBio] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const profileRes = await getRoommateProfile();
      if (profileRes.status === 'success' && profileRes.profile) {
        const p = profileRes.profile;
        setProfile(p);
        setSleepHabit(p.sleep_habit);
        setStudyHabit(p.study_habit);
        setCleanliness(p.cleanliness);
        setSocialLevel(p.social_level);
        setBio(p.bio || '');
        setContactInfo(p.contact_info || '');
        
        // Fetch matches
        const matchesRes = await getRoommateMatches();
        if (matchesRes.status === 'success') {
          setMatches(matchesRes.matches || []);
          setSetupRequired(matchesRes.setupRequired);
        }
      } else {
        setSetupRequired(true);
      }
    } catch (e) {
      console.error('Failed to load roommate data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await saveRoommateProfile({
        sleep_habit: sleepHabit,
        study_habit: studyHabit,
        cleanliness,
        social_level: socialLevel,
        bio,
        contact_info: contactInfo
      });
      if (res.status === 'success') {
        setStep(1);
        await loadData();
      }
    } catch (err) {
      alert('Failed to save matching profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitiateChat = (targetUserId: string, name: string) => {
    // Navigate to messages and pass state to open chat
    navigate('/messages', { state: { startChatWith: targetUserId, startChatName: name } });
  };

  const renderBadge = (habit: string) => {
    switch (habit) {
      case 'early_bird': return '🌅 Early Bird';
      case 'night_owl': return '🦉 Night Owl';
      case 'silent': return '🤫 Silent Study';
      case 'background_noise': return '🎧 Music study';
      case 'neat_freak': return '✨ Neat Freak';
      case 'moderate': return '🧼 Clean/Tidy';
      case 'relaxed': return '👕 Chill/Relaxed';
      case 'introvert': return '🛋️ Quiet/Introvert';
      case 'extrovert': return '🎉 Outgoing/Extrovert';
      case 'balanced': return '☕ Socially Balanced';
      default: return habit;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-amber-500 border-amber-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Finding compatible roommates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header card with glassmorphism theme */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-amber-500/10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform translate-x-20 -translate-y-20"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black/5 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> HiveMatch Roommate Finder
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Find Your Perfect Roommate</h1>
              <p className="text-amber-50/90 text-sm sm:text-base mt-2 max-w-2xl">
                Skip the roommate drama. Take our matching quiz and instantly connect with university peers who share your cleanliness, study styles, and sleep schedules.
              </p>
            </div>
            {!setupRequired && (
              <button 
                onClick={() => setSetupRequired(true)}
                className="px-5 py-3 bg-white hover:bg-amber-50 text-amber-700 rounded-2xl text-sm font-bold shadow-lg shadow-black/5 transition-all flex items-center gap-2 self-start md:self-auto"
              >
                <Edit2 className="w-4 h-4" /> Redo Matching Quiz
              </button>
            )}
          </div>
        </div>

        {setupRequired ? (
          /* ============ STEPPED QUIZ SETUP WIZARD ============ */
          <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
            <div className="bg-gray-50 px-5 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {step} of 5</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`w-4 sm:w-6 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-amber-500' : 'bg-gray-200'}`}></div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 sm:p-8 space-y-6">
              
              {step === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🌅 What is your sleeping pattern?</h2>
                    <p className="text-gray-500 text-sm mt-1">This helps match quiet hours and bedtime habits.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { value: 'early_bird', label: 'Early Bird', desc: 'Up at dawn, in bed before midnight.', icon: '🌅' },
                      { value: 'night_owl', label: 'Night Owl', desc: 'Active late, sleep in late.', icon: '🦉' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSleepHabit(opt.value)}
                        className={`p-4 sm:p-6 rounded-2xl border text-left transition-all flex flex-col justify-between h-32 sm:h-36 ${sleepHabit === opt.value ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="text-3xl">{opt.icon}</span>
                        <div>
                          <p className="font-bold text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🤫 What is your study environment?</h2>
                    <p className="text-gray-500 text-sm mt-1">Noise preferences while reading or doing assignments.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { value: 'silent', label: 'Absolute Silence', desc: 'Need pin-drop silence to concentrate.', icon: '🤫' },
                      { value: 'background_noise', label: 'Background Audio', desc: 'Study fine with music/background talk.', icon: '🎧' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStudyHabit(opt.value)}
                        className={`p-4 sm:p-6 rounded-2xl border text-left transition-all flex flex-col justify-between h-32 sm:h-36 ${studyHabit === opt.value ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="text-3xl">{opt.icon}</span>
                        <div>
                          <p className="font-bold text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🧼 Describe your cleanliness level?</h2>
                    <p className="text-gray-500 text-sm mt-1">How often you clean and organize your living space.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'neat_freak', label: '✨ Neat Freak', desc: 'Obsessed with organization. Everything in its place.' },
                      { value: 'moderate', label: '🧼 Clean & Tidy', desc: 'Keep things organized and clean on a regular schedule.' },
                      { value: 'relaxed', label: '👕 Chill & Relaxed', desc: 'Lighter cleaning routine, fine with some clutter.' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCleanliness(opt.value)}
                        className={`p-4 rounded-xl border text-left transition-all flex justify-between items-center ${cleanliness === opt.value ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div>
                          <p className="font-bold text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                        </div>
                        {cleanliness === opt.value && <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🛋️ What is your social battery?</h2>
                    <p className="text-gray-500 text-sm mt-1">Preferences for hosting guests and hanging out.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'introvert', label: '🛋️ Quiet Introvert', desc: 'Value private downtime. Peaceful and low guest visits.' },
                      { value: 'balanced', label: '☕ Socially Balanced', desc: 'Enjoy friendly visitors occasionally, but clean and calm.' },
                      { value: 'extrovert', label: '🎉 Outgoing Extrovert', desc: 'Love hosting, study groups, and having friends over.' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSocialLevel(opt.value)}
                        className={`p-4 rounded-xl border text-left transition-all flex justify-between items-center ${socialLevel === opt.value ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-400' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div>
                          <p className="font-bold text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                        </div>
                        {socialLevel === opt.value && <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">✍️ Complete Your Profile</h2>
                    <p className="text-gray-500 text-sm mt-1">Help others learn about you and how to connect.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Short Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell potential roommates about your hobbies, program of study, habits, and what you expect from a roommate..."
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Alternative Contact Info (Instagram, WhatsApp, etc.)</label>
                      <input
                        type="text"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="@username or Whatsapp number"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={
                      (step === 1 && !sleepHabit) ||
                      (step === 2 && !studyHabit) ||
                      (step === 3 && !cleanliness) ||
                      (step === 4 && !socialLevel)
                    }
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all ml-auto"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all"
                  >
                    {isSaving ? 'Finding matches...' : 'Save & View Matches!'} <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* ============ COMPATIBILITY MATCHES DECK VIEW ============ */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Compatibility Deck</h2>
                <p className="text-gray-500 text-sm mt-0.5">Students at your university who match your lifestyle.</p>
              </div>
              <div className="text-sm text-gray-500 font-semibold">{matches.length} matches found</div>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">No matches found yet</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  It seems there are no other students at your campus who have completed the questionnaire yet. Spread the word to your campus classmates!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.map(match => (
                  <div key={match.user_id} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden">
                    <div className="p-5 sm:p-8">
                      {/* Top profile line & score */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                          <div className="w-12 h-12 sm:w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center text-lg sm:text-xl shrink-0">
                            {match.avatar || match.full_name.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg leading-tight truncate">{match.full_name}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">{match.university_name || 'UCC Student'}</p>
                          </div>
                        </div>
                        
                        {/* Compatibility Score Circle */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-11 h-11 sm:w-14 h-14 rounded-full flex flex-col items-center justify-center font-black text-xs sm:text-sm border-4 ${match.score >= 75 ? 'border-green-500 text-green-600 bg-green-50/20' : 'border-amber-500 text-amber-600 bg-amber-50/20'}`}>
                            {match.score}%
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Match</span>
                        </div>
                      </div>

                      {/* Matching bullet tags */}
                      <div className="mb-6">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Shared lifestyle matches:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {match.matching_aspects.map((aspect: string) => (
                            <span key={aspect} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-full flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" /> {aspect}
                            </span>
                          ))}
                          {match.matching_aspects.length === 0 && (
                            <span className="text-xs text-gray-400">No direct lifestyle overlap, but open to connect!</span>
                          )}
                        </div>
                      </div>

                      {/* Bio content */}
                      {match.bio ? (
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                          <p className="text-sm text-gray-600 leading-relaxed italic">"{match.bio}"</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50/50 rounded-2xl p-4 mb-6 border border-dashed border-gray-200">
                          <p className="text-sm text-gray-400 leading-relaxed italic">No bio written yet.</p>
                        </div>
                      )}

                      {/* Preferences grid tags */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-600">
                          <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Sleep:</span>
                          {renderBadge(match.preferences.sleep_habit)}
                        </div>
                        <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-600">
                          <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Study:</span>
                          {renderBadge(match.preferences.study_habit)}
                        </div>
                        <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-600">
                          <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Clean:</span>
                          {renderBadge(match.preferences.cleanliness)}
                        </div>
                        <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-600">
                          <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Social:</span>
                          {renderBadge(match.preferences.social_level)}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {match.contact_info ? (
                        <span className="text-xs text-gray-500 font-semibold truncate max-w-[200px]">
                          📱 {match.contact_info}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No alternative contact</span>
                      )}
                      
                      <button 
                        onClick={() => handleInitiateChat(match.user_id, match.full_name)}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/10 flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
                      >
                        <MessageSquare className="w-4 h-4" /> Message Roommate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
