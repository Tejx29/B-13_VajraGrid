import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MockAPI } from '../../services/mockApi';
import { VajraGridLogo } from '../../components/brand/VajraGridLogo';

export function CitizenDashboard() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('Flood');
  const [otherCategory, setOtherCategory] = useState('');
  const [description, setDescription] = useState('');
  const [peopleCount, setPeopleCount] = useState('1-5');
  const [contactName, setContactName] = useState('Aarav Sharma');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [contactEmail, setContactEmail] = useState('aarav.sharma@example.com');
  const [isOther, setIsOther] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reportId, setReportId] = useState('VAJRA-2026-1048');

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setCategory(val);
    if (val === 'Other') {
      setIsOther(true);
    } else {
      setIsOther(false);
    }
  };

  const handlePrefillChange = (e) => {
    if (e.target.checked) {
      setContactName('Aarav Sharma');
      setContactPhone('+91 98765 43210');
      setContactEmail('aarav.sharma@example.com');
    } else {
      setContactName('');
      setContactPhone('');
      setContactEmail('');
    }
  };

  const submitEmergencyReport = async (e) => {
    e.preventDefault();
    const finalCategory = isOther ? otherCategory : category;
    
    try {
      const res = await MockAPI.reportIncident({
        title: finalCategory || 'Emergency',
        description: description || 'Emergency report from citizen portal.',
        location: { lat: 19.6966, lng: 72.7699, address: 'Near Manor Highway Junction, Sector 4, Palghar' },
        reporterRole: 'citizen'
      });
      setReportId(res.id.replace('inc_', 'VAJRA-2026-').toUpperCase());
    } catch (err) {
      console.error(err);
    }
    
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeConfirmation = () => {
    setShowModal(false);
    document.body.style.overflow = 'auto';
    navigate('/live-map');
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col">
      {/* Public VajraGrid Header */}
      <header className="sticky top-0 z-40 w-full bg-surface-container-lowest border-b border-outline-variant/40 shadow-[0_1px_6px_rgba(0,0,0,0.03)] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center group py-1" aria-label="VajraGrid Home">
              <VajraGridLogo variant="full" height={36} className="group-hover:opacity-95 transition-opacity" />
            </Link>
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
              <span className="bg-blue-100 text-[#0047ab] border border-blue-200/60 text-[9.5px] font-data-mono font-semibold px-2 py-0.5 rounded-full shadow-2xs w-fit">CITIZEN LINK</span>
              <span className="text-[10.5px] font-semibold text-on-surface-variant tracking-wider uppercase mt-0.5">Citizen Emergency Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-7">
              <Link className="text-[14px] font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5" to="/">
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span>Home</span>
              </Link>
              <Link className="text-[14px] font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5" to="/live-map">
                <span className="material-symbols-outlined text-[18px]">explore</span>
                <span>Live Map</span>
              </Link>
              <Link className="text-[14px] font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5" to="/live-map">
                <span className="material-symbols-outlined text-[18px]">campaign</span>
                <span>Active Alerts</span>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              </Link>
            </nav>
            <Link className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium text-[13px] border border-outline-variant/40 transition-all" to="/">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
              <span>Cancel / Back</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Portal Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: The Emergency Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Top Title & Encryption Badge */}
            <div className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[30px]">emergency_share</span>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Report an Emergency</h1>
                </div>
              </div>
            </div>

            {/* Emergency Priority Warning Banner */}
            <div className="bg-error-container/40 border-l-4 border-error p-4 rounded-xl flex items-start gap-3.5 shadow-sm">
              <span className="material-symbols-outlined text-error text-[24px] shrink-0 mt-0.5">warning</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-on-error-container text-[14px] tracking-wide uppercase">Immediate Danger?</span>
                <p className="text-on-error-container/90 text-[13px] leading-relaxed">
                  If you or someone nearby is in immediate life-threatening danger, contact local emergency services directly at <strong className="underline font-bold text-error">112</strong> before submitting this form.
                </p>
              </div>
            </div>

            {/* Form Elements */}
            <form className="flex flex-col gap-6" id="emergencyReportForm" onSubmit={submitEmergencyReport}>
              {/* Section 1: What is happening? */}
              <div className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <label className="text-[17px] font-semibold text-on-surface flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-data-mono text-[12px] font-bold">1</span>
                    What is happening?
                  </label>
                  <span className="text-[11px] font-bold text-secondary tracking-wider uppercase bg-secondary/10 px-2 py-0.5 rounded">REQUIRED</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Flood', 'Landslide', 'Fire', 'Building Collapse', 'Road Accident', 'Storm', 'Medical', 'Other'].map(type => (
                    <label key={type} className="relative cursor-pointer group">
                      <input 
                        className="peer sr-only" 
                        name="emergency_category" 
                        type="radio" 
                        value={type} 
                        checked={category === type}
                        onChange={handleCategoryChange}
                        required 
                      />
                      <div className="h-28 rounded-xl bg-surface-container-low border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-surface-container p-3 flex flex-col items-center justify-center text-center gap-2 transition-all">
                        <div className="w-10 h-10 rounded-full bg-primary/10 peer-checked:bg-primary text-primary peer-checked:text-on-primary flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-[24px]">
                            {type === 'Flood' ? 'flood' : 
                             type === 'Landslide' ? 'landslide' : 
                             type === 'Fire' ? 'local_fire_department' : 
                             type === 'Building Collapse' ? 'domain_disabled' : 
                             type === 'Road Accident' ? 'car_crash' : 
                             type === 'Storm' ? 'thunderstorm' : 
                             type === 'Medical' ? 'medical_services' : 'emergency'}
                          </span>
                        </div>
                        <span className="text-[13px] font-semibold text-on-surface">{type === 'Storm' ? 'Storm / Rain' : type}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {isOther && (
                  <div className="mt-2 pt-2" id="otherEmergencyContainer">
                    <label className="block text-[12px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Specify Emergency Situation</label>
                    <input 
                      className="w-full bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[14px]" 
                      id="otherEmergencyInput" 
                      placeholder="e.g., Gas leak, Chemical spill, Drowning hazard..." 
                      type="text"
                      value={otherCategory}
                      onChange={(e) => setOtherCategory(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Describe the emergency */}
              <div className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <label className="text-[17px] font-semibold text-on-surface flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-data-mono text-[12px] font-bold">2</span>
                    Describe the emergency
                  </label>
                  <span className="text-[11px] font-bold text-secondary tracking-wider uppercase bg-secondary/10 px-2 py-0.5 rounded">REQUIRED</span>
                </div>
                <textarea 
                  className="w-full bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[14px] leading-relaxed resize-y placeholder:text-on-surface-variant/60" 
                  placeholder="Provide clear details: e.g., Water level is rising rapidly on 2nd floor, 3 people trapped including an elderly person. Power lines fallen across the street..." 
                  required 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex items-center gap-2 text-on-surface-variant text-[12px]">
                  <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
                  <span>Tip: Mention landmarks, physical injuries, structural damage, or immediate hazards if known.</span>
                </div>
              </div>

              {/* Section 3: Location */}
              <div className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <label className="text-[17px] font-semibold text-on-surface flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-data-mono text-[12px] font-bold">3</span>
                    Location Status
                  </label>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-secondary tracking-wider uppercase bg-secondary/10 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span> GPS ACTIVE
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  <div className="flex flex-col justify-between gap-3">
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">Detected Location</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-data-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Accurate (±4m)
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">location_on</span>
                        <div>
                          <span className="font-bold text-on-surface text-[16px] block">Palghar, Maharashtra</span>
                          <span className="text-[12px] text-on-surface-variant">Near Manor Highway Junction, Sector 4</span>
                        </div>
                      </div>
                      <div className="mt-1 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[12px] font-data-mono text-on-surface-variant">
                        <span>Lat: 19.6966° N</span>
                        <span>Long: 72.7699° E</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button className="py-2.5 px-3 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all" type="button">
                        <span className="material-symbols-outlined text-[16px]">my_location</span>
                        <span>Use GPS</span>
                      </button>
                      <button className="py-2.5 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 border border-outline-variant/30 transition-all" type="button">
                        <span className="material-symbols-outlined text-[16px]">map</span>
                        <span>Choose Map</span>
                      </button>
                      <button className="py-2.5 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 border border-outline-variant/30 transition-all" type="button">
                        <span className="material-symbols-outlined text-[16px]">edit_location</span>
                        <span>Manual</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative h-52 md:h-auto rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container shadow-inner">
                    <div className="absolute inset-0 bg-cover bg-center map-bg" style={{ filter: 'brightness(0.92) contrast(1.05)' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-12 h-12 rounded-full bg-error/30 animate-ping"></span>
                        <span className="absolute w-6 h-6 rounded-full bg-error/50"></span>
                        <div className="relative z-10 bg-error text-white p-2 rounded-full shadow-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-[22px]">location_pin</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-2 rounded-lg flex items-center justify-between border border-outline-variant/30 shadow-md">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface">
                        <span className="material-symbols-outlined text-[15px] text-primary">pin_drop</span>
                        <span>Pin: 19.6966° N, 72.7699° E</span>
                      </div>
                      <button className="bg-primary text-on-primary px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-primary-container transition-colors" type="button">
                        Confirm Location
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Add Evidence */}
              <div className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <label className="text-[17px] font-semibold text-on-surface flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-data-mono text-[12px] font-bold">4</span>
                    Add Evidence (Photos / Videos)
                  </label>
                  <span className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase bg-surface-container-high px-2 py-0.5 rounded">OPTIONAL</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl h-32 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all group p-2 text-center">
                    <span className="material-symbols-outlined text-[28px] text-on-surface-variant group-hover:text-primary transition-colors">add_a_photo</span>
                    <span className="text-[12px] font-semibold text-on-surface-variant group-hover:text-primary">+ Add Photo</span>
                    <span className="text-[10px] text-on-surface-variant/70">JPG, PNG up to 25MB</span>
                    <input accept="image/*" className="sr-only" type="file" />
                  </label>
                  <label className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl h-32 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all group p-2 text-center">
                    <span className="material-symbols-outlined text-[28px] text-on-surface-variant group-hover:text-primary transition-colors">video_call</span>
                    <span className="text-[12px] font-semibold text-on-surface-variant group-hover:text-primary">+ Add Video</span>
                    <span className="text-[10px] text-on-surface-variant/70">MP4, MOV up to 60MB</span>
                    <input accept="video/*" className="sr-only" type="file" />
                  </label>
                  <div className="relative h-32 rounded-xl overflow-hidden border border-outline-variant/50 group">
                    <img alt="Evidence thumbnail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_7fDyCqGH_BVgCpFzrjN9YHRv_yNZ1ZfL7WOldXcvI_Q-MdJKrv7f40eB_wvOcUOjfoOKUWWPGHR6X2-UBF4Nz5txeHQxvqdypQ3LfCscnjAFg1YNK1InNegY-MOfj8kFAK1LuCJAbUKatdFf_buIDGeHteQRhI4BIUNYHreT8vVuP9jSOKxVxQuMM6CNI3-TuIRx01-ZcgN1RAOANb5dcAr8gB6bpECs3Dbo5vP3GxxPYTrsxrbj" />
                    <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-data-mono px-1.5 py-0.5 rounded font-medium">IMG_01.JPG</span>
                    <button className="absolute top-1.5 right-1.5 w-6 h-6 bg-surface-container-lowest/90 hover:bg-error hover:text-white rounded-full flex items-center justify-center text-on-surface transition-colors shadow" title="Remove" type="button">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex items-center justify-between text-white text-[10px]">
                      <span>2.4 MB</span>
                      <span className="text-emerald-400 flex items-center"><span className="material-symbols-outlined text-[12px] mr-0.5">check_circle</span>Ready</span>
                    </div>
                  </div>
                  <div className="relative h-32 rounded-xl overflow-hidden border border-outline-variant/50 group">
                    <img alt="Evidence thumbnail" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDo0m8H9fmUDXxijcH7xa0XpAG4mt1ZBhg3_wHP2ITEGVgskqq-n8BaxcEKQ68a2cIJ_m-AX67F6_ePwVghkhTHHB5MLa9h3kbeShA8nVRMrjPF3KeqC4fWra8lZd4ZKlxbgKjpGYGQj6qHuk2HzuVw7XJp_FRiVgPG_AB_4rGNhdlmMOPy0Sclyc6xZLPrsEX4kF4UzMC5XWN1IeQ16OqTZsJUwH0gszMB-qybL8Ay7Ev5Vdbf6T8k" />
                    <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-data-mono px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">videocam</span> VID_02.MP4
                    </span>
                    <button className="absolute top-1.5 right-1.5 w-6 h-6 bg-surface-container-lowest/90 hover:bg-error hover:text-white rounded-full flex items-center justify-center text-on-surface transition-colors shadow" title="Remove" type="button">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex items-center justify-between text-white text-[10px]">
                      <span>14.8 MB</span>
                      <span className="text-emerald-400 flex items-center"><span className="material-symbols-outlined text-[12px] mr-0.5">check_circle</span>Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: People Affected */}
              <div className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <label className="text-[17px] font-semibold text-on-surface flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-data-mono text-[12px] font-bold">5</span>
                    People Affected &amp; Vulnerabilities
                  </label>
                  <span className="text-[11px] font-bold text-secondary tracking-wider uppercase bg-secondary/10 px-2 py-0.5 rounded">CRITICAL DATA</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-on-surface-variant mb-2">Estimated People Impacted / Trapped</label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {['1-5', '6-20', '21-50', '50+'].map(val => (
                        <label key={val} className="cursor-pointer">
                          <input 
                            className="peer sr-only" 
                            name="people_count" 
                            type="radio" 
                            value={val} 
                            checked={peopleCount === val}
                            onChange={(e) => setPeopleCount(e.target.value)}
                          />
                          <div className="bg-surface-container-low border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary py-2.5 rounded-xl font-data-mono text-[13px] font-bold text-center transition-all">
                            {val}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <label className="flex-1 flex items-start gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer hover:bg-surface-container transition-colors">
                      <input className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary mt-0.5" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-on-surface">Immediate danger to life</span>
                        <span className="text-[11px] text-on-surface-variant">Someone is seriously injured, trapped, or submerged.</span>
                      </div>
                    </label>
                    <label className="flex-1 flex items-start gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer hover:bg-surface-container transition-colors">
                      <input className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary mt-0.5" type="checkbox" />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-on-surface">Vulnerable persons present</span>
                        <span className="text-[11px] text-on-surface-variant">Children, infants, elderly, pregnant, or disabled individuals.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 6: Contact Information */}
              <div className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <label className="text-[17px] font-semibold text-on-surface flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-data-mono text-[12px] font-bold">6</span>
                    Contact Information
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] text-on-surface-variant font-medium">
                    <input 
                      className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary" 
                      id="prefillCheck" 
                      onChange={handlePrefillChange}
                      defaultChecked
                      type="checkbox" 
                    />
                    <span>Use registered profile</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Full Name <span className="text-error">*</span></label>
                    <input 
                      className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[14px]" 
                      id="contactName" 
                      required 
                      type="text" 
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Phone Number <span className="text-error">*</span></label>
                    <input 
                      className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[14px]" 
                      id="contactPhone" 
                      required 
                      type="tel" 
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">Email (Optional)</label>
                    <input 
                      className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[14px]" 
                      id="contactEmail" 
                      type="email" 
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Primary Submit CTA */}
              <div className="pt-2">
                <button className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 px-6 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-3 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all" type="submit">
                  <span>Submit Emergency Report</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
                <p className="text-center text-[12px] text-on-surface-variant mt-2">
                  By submitting, you confirm that this information is accurate to the best of your knowledge. False reports can face legal action under the Disaster Management Act.
                </p>
              </div>
            </form>
          </div>

          {/* Right 1 Col: Guidance Sidebar Panel */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-on-surface border-b border-outline-variant/20 pb-3">
                <span className="material-symbols-outlined text-[22px] text-error">phone_in_talk</span>
                <div>
                  <h2 className="text-[16px] font-bold text-on-surface">Emergency Assistance Hotlines</h2>
                  <p className="text-[11px] text-on-surface-variant font-mono">Palghar District &amp; Maharashtra EOC</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <a className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/20 group" href="tel:112">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-error group-hover:scale-110 transition-transform">emergency</span>
                    <span className="text-[13px] font-medium text-on-surface">National Emergency Service</span>
                  </div>
                  <span className="font-data-mono font-bold text-primary text-[15px] bg-surface-container-high border border-outline-variant/40 px-2.5 py-0.5 rounded shadow-sm">112</span>
                </a>
                <a className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/20 group" href="tel:02525252020">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-[#0047ab] group-hover:scale-110 transition-transform">hub</span>
                    <span className="text-[13px] font-medium text-on-surface">Palghar District EOC Control</span>
                  </div>
                  <span className="font-data-mono font-bold text-primary text-[13px] bg-surface-container-high border border-outline-variant/40 px-2.5 py-0.5 rounded shadow-sm">02525-252020</span>
                </a>
                <a className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/20 group" href="tel:108">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">ambulance</span>
                    <span className="text-[13px] font-medium text-on-surface">Medical Ambulance</span>
                  </div>
                  <span className="font-data-mono font-bold text-primary text-[15px] bg-surface-container-high border border-outline-variant/40 px-2.5 py-0.5 rounded shadow-sm">108</span>
                </a>
                <a className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/20 group" href="tel:101">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-orange-600 group-hover:scale-110 transition-transform">local_fire_department</span>
                    <span className="text-[13px] font-medium text-on-surface">Fire Brigade</span>
                  </div>
                  <span className="font-data-mono font-bold text-primary text-[15px] bg-surface-container-high border border-outline-variant/40 px-2.5 py-0.5 rounded shadow-sm">101</span>
                </a>
                <a className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/20 group" href="tel:1078">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary group-hover:scale-110 transition-transform">tsunami</span>
                    <span className="text-[13px] font-medium text-on-surface">Disaster Management (NDMA)</span>
                  </div>
                  <span className="font-data-mono font-bold text-primary text-[15px] bg-surface-container-high border border-outline-variant/40 px-2.5 py-0.5 rounded shadow-sm">1078</span>
                </a>
                <a className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors flex items-center justify-between border border-outline-variant/20 group" href="tel:02528222110">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-cyan-600 group-hover:scale-110 transition-transform">waves</span>
                    <span className="text-[13px] font-medium text-on-surface">Dahanu Coastal Emergency Cell</span>
                  </div>
                  <span className="font-data-mono font-bold text-primary text-[13px] bg-surface-container-high border border-outline-variant/40 px-2.5 py-0.5 rounded shadow-sm">02528-222110</span>
                </a>
              </div>
            </div>

            {/* Phase 1: Disaster Preparedness Checklists (BEFORE Disaster) */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-on-surface border-b border-outline-variant/20 pb-3">
                <span className="material-symbols-outlined text-[22px] text-primary">fact_check</span>
                <div>
                  <h3 className="text-[15px] font-bold text-on-surface">Preparedness Checklists</h3>
                  <p className="text-[11px] text-on-surface-variant">Phase 1: Readiness guidelines for citizens</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs text-on-surface-variant">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="material-symbols-outlined text-[16px]">water</span>
                    <span>Monsoon &amp; Flood Readiness</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11.5px] leading-relaxed text-on-surface/80 pl-1">
                    <li>Identify nearest elevated relief shelter (Palghar/Wada/Dahanu).</li>
                    <li>Turn off main electricity breaker if water level enters house.</li>
                    <li>Stock 72 hours of sealed drinking water &amp; non-perishables.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-cyan-700 font-bold">
                    <span className="material-symbols-outlined text-[16px]">air</span>
                    <span>Coastal Cyclone &amp; Surge Safety</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11.5px] leading-relaxed text-on-surface/80 pl-1">
                    <li>Strictly avoid Kelwa, Bordi, &amp; Satpati shorelines during high tide.</li>
                    <li>Secure loose rooftop tin sheets and solar panels.</li>
                    <li>Track official GDACS alerts and radar on VajraGrid Live Map.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-amber-700 font-bold">
                    <span className="material-symbols-outlined text-[16px]">landscape</span>
                    <span>Ghat &amp; Landslide Safety (Jawhar/Mokhada)</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11.5px] leading-relaxed text-on-surface/80 pl-1">
                    <li>Avoid night transit on steep ghat sections during heavy downpours.</li>
                    <li>Report sudden slope cracks or falling rocks immediately.</li>
                  </ul>
                </div>

                <Link 
                  to="/live-map" 
                  className="w-full py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary border border-primary/30 font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">satellite_alt</span>
                  <span>Inspect Live Hazard Telemetry</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="confirmationModal">
          <div className="bg-surface-container-lowest max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-2xl border border-outline-variant/40 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-on-surface">Report Successfully Submitted</h3>
                  <p className="text-[12px] text-on-surface-variant">First response unit dispatch pipeline initiated</p>
                </div>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors" onClick={closeConfirmation}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="bg-surface-container-low p-4 rounded-xl border border-primary/20 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Unique Incident Reference ID</span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-data-mono">CONFIRMED</span>
              </div>
              <span className="text-2xl font-bold text-primary font-data-mono tracking-tight">{reportId}</span>
              <p className="text-[12px] text-on-surface-variant">Please keep this ID handy. Status updates are simulated for demonstration purposes ({contactPhone || 'your number'}). For real emergencies, always contact 112 directly.</p>
            </div>
            
            <div className="flex flex-col gap-3.5 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
              <span className="text-[12px] font-bold text-on-surface uppercase tracking-wider">Live Processing Status</span>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[12px]">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-on-surface">Submitted & Geocoded</span>
                  <span className="text-[11px] font-data-mono text-emerald-600 font-bold">Done (0.4s)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[12px] animate-pulse">
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-on-surface">AI Analysis & Severity Scoring</span>
                  <span className="text-[11px] font-data-mono text-primary font-bold">In Progress (85%)</span>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[12px]">
                  <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-on-surface">Authority Verification & Unit Dispatch</span>
                  <span className="text-[11px] font-data-mono text-on-surface-variant">Pending</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button className="flex-1 py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-[13px] border border-outline-variant/40 transition-colors flex items-center justify-center gap-2" onClick={closeConfirmation}>
                <span className="material-symbols-outlined text-[18px]">track_changes</span>
                <span>Track Report Status</span>
              </button>
              <button className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-[13px] shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2" onClick={closeConfirmation}>
                <span className="material-symbols-outlined text-[18px]">map</span>
                <span>Return to Live Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
