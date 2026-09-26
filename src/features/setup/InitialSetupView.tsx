import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Lock,
  User as UserIcon,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { setupApi } from '../../services/apiServices.ts';
import { ApiClientError } from '../../services/apiClient.ts';
import { useOrganization } from '../../context/OrganizationContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface InitialSetupViewProps {
  onComplete: () => void;
}

export const InitialSetupView: React.FC<InitialSetupViewProps> = ({ onComplete }) => {
  const { refreshOrganization } = useOrganization();
  const { setSessionUser } = useAuth();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1: Organization state
  const [orgData, setOrgData] = useState({
    name: '',
    legalName: '',
    organizationCode: '',
    industry: 'Technology & Enterprise Software',
    country: 'India',
    timezone: 'Asia/Kolkata',
    primaryEmail: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    website: '',
  });

  // Step 2: Administrator state
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setOrgData((prev) => ({
      ...prev,
      [name]: name === 'organizationCode' ? value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') : value,
    }));
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setAdminData((prev) => ({ ...prev, [name]: value }));
  };

  const validateOrgStep = () => {
    if (!orgData.name.trim()) return 'Organization Name is required';
    if (!orgData.legalName.trim()) return 'Legal Name is required';
    if (!orgData.organizationCode.trim()) return 'Organization Code is required';
    if (orgData.organizationCode.length < 2) return 'Organization Code must be at least 2 characters';
    if (!orgData.country.trim()) return 'Country is required';
    if (!orgData.timezone.trim()) return 'Timezone is required';
    if (!orgData.primaryEmail.trim() || !orgData.primaryEmail.includes('@'))
      return 'Valid Primary Email is required';
    return null;
  };

  const validateAdminStep = () => {
    if (!adminData.firstName.trim()) return 'Administrator First Name is required';
    if (!adminData.lastName.trim()) return 'Administrator Last Name is required';
    if (!adminData.email.trim() || !adminData.email.includes('@'))
      return 'Valid Administrator Email is required';
    if (!adminData.password || adminData.password.length < 8)
      return 'Password must be at least 8 characters long';
    if (adminData.password !== adminData.confirmPassword)
      return 'Passwords do not match';
    return null;
  };

  const handleProceedToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateOrgStep();
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleSubmitSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateAdminStep();
    if (err) {
      setErrorMessage(err);
      return;
    }

    setErrorMessage(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await setupApi.initialize({
        organization: orgData,
        administrator: {
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          email: adminData.email,
          password: adminData.password,
        },
      });

      if (res?.success) {
        if (res.user) {
          setSessionUser(res.user, res.token);
        }
        await refreshOrganization();
        onComplete();
      }
    } catch (err: any) {
      if (err instanceof ApiClientError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
        setErrorMessage(err.message || 'Please correct the validation errors below.');
        // If the backend reported organization validation errors, redirect back to step 1
        const orgFields = ['organizationCode', 'name', 'legalName', 'primaryEmail', 'country', 'timezone', 'industry'];
        if (orgFields.some((f) => err.fieldErrors[f])) {
          setStep(1);
        }
      } else {
        setErrorMessage(err?.message || 'Failed to complete system setup. Please verify backend connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-sm font-bold text-xl tracking-tight">
          W
        </div>
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">WorkSphere</h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-primary">Enterprise HCM Platform</p>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/60 rounded-3xl shadow-md overflow-hidden">
        {/* Step 0: Welcome Screen */}
        {step === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6 ring-12 ring-primary/5">
              <Building2 className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Fresh Installation
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mb-3">
              Welcome to WorkSphere
            </h2>

            <p className="text-base text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed">
              Your organization isn't configured yet. Set up your organization and initial administrator account to begin building your enterprise workforce.
            </p>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-bold text-on-primary bg-primary hover:bg-primary/95 rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Create Organization</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 1 & 2 Progress Bar */}
        {step > 0 && (
          <div className="border-b border-outline-variant/40 bg-surface-container-low/40 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1
                    ? 'bg-primary text-on-primary'
                    : 'bg-primary/20 text-primary'
                }`}
              >
                1
              </div>
              <span className={`text-xs font-semibold ${step === 1 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                Organization Profile
              </span>
            </div>

            <div className="h-0.5 w-12 bg-outline-variant/60"></div>

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold ${step === 2 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                Administrator Setup
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-error-container/30 border border-error/40 flex items-start gap-3 text-error text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Setup Error</p>
              <p className="text-xs text-error/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Step 1 Form: Organization Details */}
        {step === 1 && (
          <form onSubmit={handleProceedToAdmin} className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-on-surface tracking-tight">Step 1: Organization Details</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Establish the root entity for all legal departments, locations, workforce, and payroll runs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Organization Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={orgData.name}
                  onChange={handleOrgChange}
                  placeholder="e.g. Nexus Technologies"
                  required
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.name ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.name && <p className="text-xs text-error mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Legal Entity Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="legalName"
                  value={orgData.legalName}
                  onChange={handleOrgChange}
                  placeholder="e.g. Nexus Technologies Private Limited"
                  required
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.legalName ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.legalName && <p className="text-xs text-error mt-1">{fieldErrors.legalName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Organization Code <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="organizationCode"
                  value={orgData.organizationCode}
                  onChange={handleOrgChange}
                  placeholder="e.g. NEXUS01"
                  required
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.organizationCode ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.organizationCode ? (
                  <p className="text-xs text-error mt-1">{fieldErrors.organizationCode}</p>
                ) : (
                  <p className="text-[10px] text-on-surface-variant mt-1">Unique tenant identifier</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  name="industry"
                  value={orgData.industry}
                  onChange={handleOrgChange}
                  placeholder="e.g. Cloud Infrastructure / SaaS"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Country <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={orgData.country}
                  onChange={handleOrgChange}
                  placeholder="e.g. India"
                  required
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.country ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.country && <p className="text-xs text-error mt-1">{fieldErrors.country}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Timezone <span className="text-error">*</span>
                </label>
                <select
                  name="timezone"
                  value={orgData.timezone}
                  onChange={handleOrgChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Primary Corporate Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  name="primaryEmail"
                  value={orgData.primaryEmail}
                  onChange={handleOrgChange}
                  placeholder="admin@nexuscorp.local"
                  required
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.primaryEmail ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.primaryEmail && (
                  <p className="text-xs text-error mt-1">{fieldErrors.primaryEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={orgData.phone}
                  onChange={handleOrgChange}
                  placeholder="+91-80-45678900"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Registered Address
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={orgData.addressLine1}
                  onChange={handleOrgChange}
                  placeholder="Outer Ring Road, Bellandur Campus"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={orgData.city}
                  onChange={handleOrgChange}
                  placeholder="Bengaluru"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={orgData.state}
                  onChange={handleOrgChange}
                  placeholder="Karnataka"
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-on-primary bg-primary hover:bg-primary/95 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Continue to Admin Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2 Form: Initial Administrator */}
        {step === 2 && (
          <form onSubmit={handleSubmitSetup} className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-on-surface tracking-tight">Step 2: Create Initial Administrator</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Configure your root executive account with global SYSTEM_ADMIN capabilities. Passwords are encrypted via BCrypt.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  First Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={adminData.firstName}
                  onChange={handleAdminChange}
                  placeholder="e.g. Arun"
                  required
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.firstName ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.firstName && <p className="text-xs text-error mt-1">{fieldErrors.firstName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Last Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={adminData.lastName}
                  onChange={handleAdminChange}
                  placeholder="e.g. Kumar"
                  required
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.lastName ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.lastName && <p className="text-xs text-error mt-1">{fieldErrors.lastName}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Administrator Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={adminData.email}
                  onChange={handleAdminChange}
                  placeholder="arun.kumar@nexuscorp.local"
                  required
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.email ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.email && <p className="text-xs text-error mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Password <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={adminData.password}
                  onChange={handleAdminChange}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    fieldErrors.password ? 'border-error ring-1 ring-error' : 'border-outline-variant/60'
                  }`}
                />
                {fieldErrors.password && <p className="text-xs text-error mt-1">{fieldErrors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Confirm Password <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={adminData.confirmPassword}
                  onChange={handleAdminChange}
                  placeholder="Re-enter password"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-high/60 border border-outline-variant/60 text-xs text-on-surface-variant flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Atomic Transaction: The organization and administrator records will be created together. If either fails, the operation rolls back to keep the database completely clean.
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Organization
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-on-primary bg-primary hover:bg-primary/95 disabled:opacity-50 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Initializing System...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Setup & Launch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
