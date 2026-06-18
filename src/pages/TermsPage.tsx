import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { updateMetaTags } from '../utils/seo';

export default function TermsPage() {
  useEffect(() => {
    updateMetaTags({
      title: "Terms of Service & Privacy Policy | UNIHIVE",
      description: "Read the Terms of Service and Privacy Policy for UNIHIVE. Understand our student accommodation booking terms, privacy protection, and usage guidelines.",
    });
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-3xl border border-gray-200 overflow-hidden">
        <div className="bg-amber-500 px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white">UniHive by Cyybrid Technology</p>
              <h1 className="text-3xl font-bold text-white">Terms of Service & Privacy Policy</h1>
            </div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Agreement and Account Eligibility</h2>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              Welcome to UniHive. By accessing or using our platform, you agree to be bound by these Terms of Service and our Privacy Policy. Our services are exclusively available to individuals who can form legally binding contracts under applicable law.
            </p>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              To use certain features of UniHive, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. Your account must represent a real student or an authorized hostel manager. Creating multiple accounts or registering on behalf of others without authorization is strictly prohibited.
            </p>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              You are responsible for safeguarding your password and for all activities that occur under your account. UniHive reserves the right to suspend or terminate accounts that violate these requirements or engage in fraudulent activities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Booking and Payment Responsibilities</h2>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              UniHive facilitates the booking of student accommodation. All bookings made through the platform are subject to availability and acceptance by the respective hostel manager. When you book a room, you agree to pay the specified reservation fee and any applicable platform fees.
            </p>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              Payments are processed securely via third-party providers like Paystack. You must provide valid payment information and authorized use of the chosen payment method. Once a booking is confirmed, the reservation fee is generally non-refundable unless specified otherwise in the specific hostel's cancellation policy.
            </p>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              UniHive is not responsible for the direct lease agreement between the student and the hostel manager. Students are advised to review the full tenancy agreement provided by the hostel before completing full payment upon move-in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Hostel Usage, Safety, and Conduct</h2>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              Students residing in hostels booked via UniHive are expected to adhere to the code of conduct and rules established by the hostel management. This includes respecting quiet hours, maintaining cleanliness in shared spaces, and ensuring the safety of the premises.
            </p>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              Managers are required to keep their listings up-to-date, including room availability, pricing, and facilities. Any misrepresentation of property features or safety standards may lead to immediate removal from the platform and potential legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Privacy and Data Protection</h2>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              Your privacy is important to us. UniHive collects personal information such as your name, email, phone number, and university affiliation to provide our services. We use this data for account management, facilitating communication between students and managers, and verifying transactions.
            </p>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              We do not sell your personal data to third parties. We may share information with law enforcement if required by law or to protect the safety and integrity of our community. For more details, please refer to our full Data Use Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Limitation of Liability</h2>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              UniHive provides a platform for connecting students with accommodation providers. While we strive to physically verify hostels, we do not guarantee the condition of the properties or the conduct of the managers or students. UniHive shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Important Notices and Amendments</h2>
            <ul className="mt-3 space-y-3 text-sm text-gray-600 leading-7 list-disc list-inside">
              <li>All users must explicitly agree to these terms before creating an account or making a booking.</li>
              <li>Gender selection is enforced for specific room types to comply with hostel policies in Ghana.</li>
              <li>UniHive reserves the right to modify these terms at any time. Significant changes will be notified via email or platform announcements.</li>
              <li>Continued use of the platform after changes are posted constitutes acceptance of the revised terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Termination</h2>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              We may terminate or suspend your access to UniHive immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the platform will immediately cease. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Governing Law</h2>
            <p className="mt-3 text-sm text-gray-600 leading-7">
              These Terms shall be governed and construed in accordance with the laws of Ghana, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>
          </section>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">Note</p>
            <p className="mt-2 text-sm text-amber-700 leading-7">
              Your agreement is required to use UniHive. Please review these terms carefully before <Link to="/register" className="underline font-bold">registering</Link> or <Link to="/hostels" className="underline font-bold">booking a hostel</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
