import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, AlertTriangle, CheckCircle, Scale, Lock, Users, CreditCard, Building2, PhoneCall } from 'lucide-react';
import { updateMetaTags } from '../utils/seo';

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  useEffect(() => {
    updateMetaTags({
      title: "Terms of Service & Privacy Policy | UNIHIVE",
      description: "Official Terms of Service, User Agreement, and Privacy Policy for UniHive by Cyybrid Technology. Student booking terms, liability disclaimers, and data protection.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 px-6 sm:px-10 py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" /> Legal &amp; Platform Agreement
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Terms of Service &amp; Privacy Policy</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Operated by <strong>Cyybrid Technology</strong> • Governed under the Laws of the Republic of Ghana
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/60">
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Scale className="w-4 h-4" /> Terms of Service (Platform Agreement)
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" /> Privacy &amp; Data Protection
            </button>
          </div>
        </div>

        {/* Highlight Summary Notice */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 sm:px-10 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong className="font-bold">Summary for Students &amp; Managers:</strong> UniHive is an independent online marketplace technology intermediary that connects tertiary students with third-party hostel providers. UniHive does not own, manage, staff, or control any listed hostels. By registering, booking, or messaging through UniHive, you expressly agree to the terms below.
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-8 sm:px-10 sm:py-10 text-slate-700 text-sm leading-7 space-y-10">
          {activeTab === 'terms' ? (
            <>
              {/* Effective Date */}
              <div className="text-xs text-slate-400 border-b border-slate-100 pb-3 flex justify-between items-center">
                <span>Last Updated &amp; Effective: January 1, 2026</span>
                <span>Jurisdiction: Accra, Republic of Ghana</span>
              </div>

              {/* Section 1 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    1
                  </div>
                  <h2>Acceptance of Agreement &amp; Definitions</h2>
                </div>
                <p>
                  These Terms of Service (the &quot;Terms&quot; or &quot;Agreement&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Student&quot;, &quot;Hostel Manager&quot;, or &quot;You&quot;) and <strong>UniHive</strong>, owned, operated, and maintained by <strong>Cyybrid Technology</strong> (&quot;UniHive&quot;, &quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;), governing your access to and use of the website located at <code>myunihive.com</code> (or related domains and local instances), mobile web applications, and related services (collectively, the &quot;Platform&quot;).
                </p>
                <p>
                  By creating an account, browsing hostels, booking accommodations, interacting with roommates, or using our messaging system, you confirm that you are at least 18 years of age (or have explicit parental or guardian consent to enroll in tertiary education accommodation) and have read, understood, and agreed to be bound by these Terms. If you do not agree, you must immediately discontinue using the Platform.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    2
                  </div>
                  <h2>Nature of UniHive: Technology Marketplace Intermediary</h2>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
                  <p className="font-semibold text-slate-900">
                    Crucial Legal Protection &amp; Intermediary Disclaimer:
                  </p>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    UniHive is strictly a <strong>software platform and digital directory intermediary</strong> designed to facilitate information discovery, communication, and electronic reservation requests between tertiary students and independent third-party hostel property owners and managers (&quot;Hostel Managers&quot;).
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-600 pl-1">
                  <li><strong>Not a Landlord or Real Estate Agent:</strong> UniHive does not own, lease, manage, inspect daily, staff, or control any hostel properties, residential facilities, or individual rooms.</li>
                  <li><strong>Independent Third Parties:</strong> Hostel Managers and property owners are independent third parties and are NOT employees, agents, joint-venturers, or partners of UniHive or Cyybrid Technology.</li>
                  <li><strong>Contractual Relationship:</strong> Any booking, tenancy, accommodation agreement, or rental lease is formed solely between the Student and the respective Hostel Manager. UniHive is not a party to any rental contract.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    3
                  </div>
                  <h2>User Accounts &amp; Identity Verification</h2>
                </div>
                <p>
                  To access features such as reservation requests, in-app messaging, or roommate matching, you must register an account using accurate, current, and complete personal information (including your legal name, verified email, phone number, and institution).
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <p className="font-bold text-slate-900 mb-1">Account Security &amp; Credentials</p>
                    <p className="text-slate-600">You are solely responsible for maintaining the confidentiality of your credentials and One-Time Passcodes (OTP). Any activity occurring under your account is your legal responsibility.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <p className="font-bold text-slate-900 mb-1">Strict Prohibition of Impersonation</p>
                    <p className="text-slate-600">Falsely misrepresenting your student status, submitting forged national or student identification documents, or impersonating university officials or property managers will result in permanent termination and referral to Ghanaian law enforcement.</p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    4
                  </div>
                  <h2>Hostel Listings, Verification Badges &amp; Accuracy</h2>
                </div>
                <p>
                  Hostel Managers are legally and contractually responsible for the complete accuracy, truthfulness, and currency of all details uploaded to their listings, including prices, amenities (Wi-Fi, water supply, generator backup, air conditioning), room photos, security measures, and room availability.
                </p>
                <p>
                  While UniHive performs periodic verification procedures (including contact checks and physical badge reviews), <strong>UniHive does not guarantee or warrant that listings are free of error, 100% complete, or that utilities (such as ECG electricity, backup generators, or Ghana Water Company supply) will never experience municipal disruptions.</strong> Students are strongly encouraged to inspect facilities in person or request virtual video tours prior to making major financial commitments.
                </p>
              </section>

              {/* Section 5 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    5
                  </div>
                  <h2>Bookings, Mobile Money (MoMo) Payments &amp; Refunds</h2>
                </div>
                <div className="space-y-3 text-slate-600">
                  <p>
                    <strong>Payment Processing:</strong> All electronic transactions initiated via Mobile Money (MTN MoMo, Telecel Cash, AT Money) or debit card are processed through licensed, PCI-DSS compliant third-party payment gateways (such as Paystack / Flutterwave). UniHive does not hold, store, or possess direct access to your MoMo PINs or payment card CVVs.
                  </p>
                  <p>
                    <strong>Reservation Status &amp; Check-In:</strong> A booking is finalized only upon receipt of official transaction confirmation and the generation of your UniHive Check-In Passcode. You must present this passcode and valid student ID upon arrival at the hostel.
                  </p>
                  <p>
                    <strong>Refunds &amp; Cancellations:</strong> Because hostel allocations depend on individual hostel property management policies:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
                    <li>Each hostel maintains its own refund, deposit retention, and cancellation windows.</li>
                    <li>UniHive platform processing fees or SMS/gateway levies are non-refundable once an electronic transaction is completed.</li>
                    <li>Disputes regarding condition of rooms upon check-in must be logged within 24 hours of arrival through the UniHive Concierge for mediation.</li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    6
                  </div>
                  <h2>Roommate Finder &amp; In-App Communications</h2>
                </div>
                <p>
                  The Roommate Finder feature matches students based on voluntary algorithmic survey answers (lifestyle, study habits, campus proximity, budget).
                </p>
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-950 text-xs sm:text-sm space-y-2">
                  <div className="font-bold flex items-center gap-2 text-red-800">
                    <Shield className="w-4 h-4" /> Personal Safety &amp; Non-Liability for Cohabitation:
                  </div>
                  <p>
                    UniHive does not perform criminal background checks or psychological evaluations on students. You are solely responsible for exercising personal discretion and safety when conversing with, meeting, or selecting potential roommates. UniHive and Cyybrid Technology expressly disclaim any liability for interpersonal disputes, theft, property damage, harassment, assault, or incompatibility between roommates.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    7
                  </div>
                  <h2>Strict User Conduct &amp; Prohibited Activities</h2>
                </div>
                <p>You agree not to engage in any of the following prohibited behaviors on UniHive:</p>
                <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <li className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Posting fraudulent, deceptive, or scam hostel listings or soliciting advance cash outside official channels.</span>
                  </li>
                  <li className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Harassment, abusive language, discrimination, stalking, or sending unsolicited marketing to other students or managers.</span>
                  </li>
                  <li className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Using scrapers, crawlers, robots, or automated scripts to harvest listings, user details, or system data.</span>
                  </li>
                  <li className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Attempting to circumvent, probe, reverse-engineer, or breach UniHive security mechanisms, API endpoints, or database records.</span>
                  </li>
                </ul>
              </section>

              {/* Section 8 - The Legal Defense Shield */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    8
                  </div>
                  <h2>Disclaimers of Warranties &amp; Limitation of Liability</h2>
                </div>
                <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl space-y-3 text-xs sm:text-sm leading-relaxed">
                  <p className="uppercase font-bold tracking-wider text-amber-400">
                    &quot;As-Is&quot; and &quot;As-Available&quot; Provision:
                  </p>
                  <p>
                    THE UNIHIVE PLATFORM, ITS SOFTWARE, SERVICES, HOSTEL DIRECTORY, COMMUTE ESTIMATIONS, AND CONTENT ARE PROVIDED STRICTLY ON AN &quot;AS-IS&quot; AND &quot;AS-AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, HABITABILITY OF PREMISES, OR CONTINUOUS UNINTERRUPTED UPTIME.
                  </p>
                  <p className="uppercase font-bold tracking-wider text-amber-400">
                    Maximum Limitation of Legal Liability:
                  </p>
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY THE LAWS OF THE REPUBLIC OF GHANA, IN NO EVENT SHALL UNIHIVE, CYYBRID TECHNOLOGY, ITS FOUNDERS, DIRECTORS, EMPLOYEES, AFFILIATES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, PHYSICAL INJURY, PROPERTY DAMAGE, THEFT AT A HOSTEL, ROOMMATE CONFLICTS, MISREPRESENTATION BY HOSTEL OWNERS, OR POWER/WATER OUTAGES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM.
                  </p>
                  <p>
                    IN ALL CASES, THE TOTAL AGGREGATE LIABILITY OF UNIHIVE AND CYYBRID TECHNOLOGY ARISING UNDER OR RELATED TO THESE TERMS SHALL NOT EXCEED THE TOTAL PLATFORM SERVICE COMMISSION ACTUALLY RECEIVED BY UNIHIVE FROM YOUR SPECIFIC BOOKING TRANSACTION IN THE THREE (3) MONTHS PRECEDING THE EVENT, OR ONE HUNDRED GHANAIAN CEDIS (GH₵100.00), WHICHEVER IS LESS.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    9
                  </div>
                  <h2>Indemnification</h2>
                </div>
                <p>
                  You agree to defend, indemnify, and hold harmless UniHive, Cyybrid Technology, its officers, contractors, and affiliates from and against any and all claims, liabilities, damages, judgments, losses, costs, and legal fees arising out of or related to:
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 space-y-1.5 pl-2">
                  <li>Your violation of these Terms or any applicable Ghanaian laws or municipal housing regulations;</li>
                  <li>Your conduct at any hostel premises, including damage to property, disturbance of peace, or breach of house rules;</li>
                  <li>Any content, review, photo, or document you upload or distribute through the Platform;</li>
                  <li>Any disputes, contracts, or tenancy agreements entered into between you and any Hostel Manager or fellow roommate.</li>
                </ul>
              </section>

              {/* Section 10 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    10
                  </div>
                  <h2>Dispute Resolution &amp; Governing Law</h2>
                </div>
                <p>
                  These Terms, their interpretation, and any disputes arising out of your relationship with UniHive shall be governed exclusively by and construed in accordance with the substantive laws of the <strong>Republic of Ghana</strong>, without regard to conflict of law principles.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                  <p className="font-bold text-slate-900">Mandatory Amicable Negotiation &amp; Arbitration:</p>
                  <p className="text-slate-600 leading-relaxed">
                    Prior to initiating any formal legal claim or lawsuit, the parties shall attempt in good faith to resolve any dispute through informal conciliation with UniHive Support for thirty (30) days. In the event that informal negotiation fails, any controversy shall be finally resolved through confidential arbitration in Accra, Ghana, under the Alternative Dispute Resolution Act, 2010 (Act 798).
                  </p>
                </div>
              </section>

              {/* Section 11 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    11
                  </div>
                  <h2>Modifications &amp; Severability</h2>
                </div>
                <p>
                  UniHive reserves the right, at its sole discretion, to modify or replace these Terms at any time. When substantial changes occur, we will update the &quot;Last Updated&quot; date at the top of this document and notify registered users via email or an announcement on the Platform. Your continued use of UniHive following any modifications constitutes full acceptance of the updated Terms.
                </p>
                <p>
                  If any provision of these Terms is found to be unlawful, void, or unenforceable by an arbitrator or court of competent jurisdiction, that specific provision shall be deemed severable and shall not affect the validity and enforceability of any remaining provisions.
                </p>
              </section>
            </>
          ) : (
            /* Tab 2: Privacy Policy */
            <>
              <div className="text-xs text-slate-400 border-b border-slate-100 pb-3 flex justify-between items-center">
                <span>Ghana Data Protection Act, 2012 (Act 843) Compliant</span>
                <span>Data Controller: Cyybrid Technology</span>
              </div>

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    1
                  </div>
                  <h2>Commitment to Student Data Privacy</h2>
                </div>
                <p>
                  UniHive and Cyybrid Technology respect your fundamental privacy rights. This Privacy Policy outlines how we collect, process, store, and safeguard your personal information when you access our Platform, in accordance with the <strong>Data Protection Act, 2012 (Act 843) of Ghana</strong>.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    2
                  </div>
                  <h2>Information We Collect</h2>
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-600 text-xs sm:text-sm pl-1">
                  <li><strong>Account Registration Data:</strong> Full legal name, student email address, Ghanaian phone number (+233), university/campus affiliation, gender, and encrypted account password.</li>
                  <li><strong>Identity Verification Data (When Required):</strong> Student identification cards, national Ghana Card verification scans, or student admission numbers to safeguard community authenticity.</li>
                  <li><strong>Booking &amp; Transaction Metadata:</strong> Reservation history, hostel preferences, room selections, payment timestamps, and transaction reference numbers. <em>(Note: We do NOT store payment PINs or credit card CVV codes).</em></li>
                  <li><strong>Roommate Profile Information:</strong> Lifestyle preferences (study habits, sleep schedule, cleanliness preferences, hobbies) shared voluntarily for matching.</li>
                  <li><strong>Technical Log Data:</strong> IP addresses, browser types, device fingerprints, PWA tokens, and session activity logs for system security and fraud prevention.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    3
                  </div>
                  <h2>How We Use Your Data</h2>
                </div>
                <p>Your personal data is strictly utilized for authorized business and operational purposes:</p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <p className="font-bold text-slate-900 mb-1">Accommodation Fulfilment</p>
                    <p className="text-slate-600">Connecting you with your chosen hostel manager, validating check-in codes, and generating official booking confirmations.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <p className="font-bold text-slate-900 mb-1">Security &amp; Fraud Prevention</p>
                    <p className="text-slate-600">Sending One-Time Security Passcodes (OTP), preventing fake hostel listings, and shielding users against financial scams.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <p className="font-bold text-slate-900 mb-1">Algorithmic Roommate Matching</p>
                    <p className="text-slate-600">Calculating compatibility percentages between students searching for shared living spaces.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <p className="font-bold text-slate-900 mb-1">Service Communications</p>
                    <p className="text-slate-600">Dispatching reservation reminders, system maintenance notices, and urgent campus housing updates.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    4
                  </div>
                  <h2>Zero Data Selling &amp; Third-Party Disclosures</h2>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 text-xs sm:text-sm space-y-2">
                  <div className="font-bold flex items-center gap-2 text-emerald-900">
                    <CheckCircle className="w-4 h-4" /> We Never Sell Your Data
                  </div>
                  <p>
                    UniHive does <strong>NOT</strong> sell, rent, monetize, or trade your personal information to third-party marketing companies, advertisers, or lead brokers.
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Data is only shared under strictly constrained operational scenarios:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2">
                  <li><strong>With Hostel Managers:</strong> Sharing your name, contact phone number, and check-in passcode specifically for hostels you voluntarily book or message.</li>
                  <li><strong>With Licensed Financial Processors:</strong> Secure transmission of payment requests to regulated payment gateways (Paystack / Mobile Money aggregators).</li>
                  <li><strong>Legal Compliance:</strong> When strictly required by law, subpoena, or a lawful court order issued by Ghanaian authorities.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    5
                  </div>
                  <h2>Data Security &amp; Retention</h2>
                </div>
                <p>
                  We implement industry-standard administrative, physical, and technical safeguards (including TLS/SSL data-in-transit encryption, bcrypt salted password hashing, and role-based database permissions) to protect your personal information against unauthorized access, loss, or alteration. We retain your account records for as long as your account remains active or as needed to comply with our statutory tax and auditing obligations in Ghana.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base sm:text-lg">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                    6
                  </div>
                  <h2>Your Privacy Rights &amp; Contacting Us</h2>
                </div>
                <p>
                  Under Act 843, you have the right to request access to the personal data we hold about you, request rectification of inaccurate records, or request deletion of your account.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-xs space-y-2">
                  <p className="font-bold text-slate-900">Privacy Officer &amp; Legal Inquiries:</p>
                  <p className="text-slate-600">
                    To exercise your data privacy rights or report a security concern, contact our data protection team directly:
                  </p>
                  <p className="text-slate-800 font-semibold">
                    Email: <a href="mailto:cyybridtechnnology@gmail.com" className="text-amber-600 underline">cyybridtechnnology@gmail.com</a><br />
                    Legal Entity: Cyybrid Technology, Greater Accra, Ghana<br />
                    Student Concierge: +233 53 314 3634
                  </p>
                </div>
              </section>
            </>
          )}

          {/* Bottom Agreement Acknowledgement */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 flex items-start gap-4">
            <CheckCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
              <p className="font-bold mb-1">Binding Agreement Notice</p>
              <p className="text-amber-900">
                By maintaining an account or transacting on UniHive, you confirm that you have read, comprehended, and agreed to these Terms of Service and Privacy Policy. If you have questions regarding any section, reach out to our legal support desk prior to completing reservations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

