"use client";

import { useMemo, useRef, useState } from "react";
import {
  PRODUCTS,
  REGION_DISTRICTS,
  PRODUCT_OPTIONS,
  formatCurrency,
  validatePhone,
  validateEmail,
  validateNIN,
  validateDOB,
  validateFarmSize,
  validateLoanAmount,
  validateApplicationPayload,
} from "@/lib/kyc";

type FormValues = Record<string, string>;

const EMPTY: FormValues = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  nin: "",
  phoneNumber: "",
  email: "",
  product: "",
  region: "",
  district: "",
  subcounty: "",
  village: "",
  primaryCrop: "",
  farmSize: "",
  annualProduction: "",
  farmingExperience: "",
  otherCrop: "",
  cooperativeName: "",
  membershipNumber: "",
  position: "",
  registrationNumber: "",
  loanAmount: "",
  loanPurpose: "",
  monthlyIncome: "",
  bankAccount: "",
};

const CHECKBOXES = ["dataConsent", "creditCheck", "termsAccept", "accurateInfo"];

export default function ApplicationForm() {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [serverMessage, setServerMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const productKey = values.product;
  const cfg = productKey ? PRODUCTS[productKey] : null;

  const districts = useMemo(
    () => (values.region ? REGION_DISTRICTS[values.region] ?? [] : []),
    [values.region],
  );

  const set = (field: string, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  };

  const validateField = (field: string, value: string): string => {
    if (field === "phoneNumber" && value && !validatePhone(value)) {
      return "Enter a valid Ugandan number (+2567XXXXXXXX or +256XXXXXXXXX).";
    }
    if (field === "email" && value && !validateEmail(value)) {
      return "Please enter a valid email address.";
    }
    if (field === "nin" && value && !validateNIN(value)) {
      return "NIN must be exactly 14 alphanumeric characters.";
    }
    if (field === "dateOfBirth" && value) {
      const r = validateDOB(value);
      if (r && !r.ok) return r.message;
    }
    if (field === "farmSize" && value) {
      const r = validateFarmSize(value);
      if (r && !r.ok) return r.message;
    }
    if (field === "loanAmount" && value) {
      if (!cfg) return "Please select a product first to see allowed loan limits.";
      const r = validateLoanAmount(value, productKey);
      if (!r.ok) return r.message;
    }
    return "";
  };

  const validateAll = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    // Reuse shared validation then add required-field rules matching kyc.ts
    const shared = validateApplicationPayload({ ...values, ...checkboxPayload() });
    Object.assign(errs, shared);

    // Client-side product-aware loan check
    if (values.loanAmount) {
      const r = validateLoanAmount(values.loanAmount, productKey);
      if (!r.ok) errs.loanAmount = r.message;
    }
    return errs;
  };

  function checkboxPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const c of CHECKBOXES) {
      out[c] = formRef.current
        ? (formRef.current.elements.namedItem(c) as HTMLInputElement | null)
            ?.checked === true
        : false;
    }
    return out;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStatus("error");
      const first = document.querySelector('[data-error="true"]') as HTMLElement;
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setStatus("submitting");
    setServerMessage("");

    const payload: Record<string, unknown> = { ...values };
    payload.loanAmount = values.loanAmount.replace(/,/g, "");
    if (payload.monthlyIncome) {
      payload.monthlyIncome = (payload.monthlyIncome as string).replace(/,/g, "");
    }
    Object.assign(payload, checkboxPayload());

    try {
      const res = await fetch("/api/submit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setStatus("success");
      setValues(EMPTY);
      formRef.current?.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setServerMessage(
        err instanceof Error
          ? err.message
          : "There was an error submitting your application. Please try again or contact us directly.",
      );
    }
  };

  return (
    <div className="form-container">
      {status === "success" && (
        <div className="mb-4 rounded-[10px] border border-[#c3e6cb] bg-[#d4edda] px-4 py-3 text-[#155724]">
          Thank you for your application! We will review your information and
          contact you within 3-5 business days.
        </div>
      )}
      {status === "error" && serverMessage && (
        <div className="mb-4 rounded-[10px] border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-[#721c24]">
          {serverMessage}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="rounded-3xl bg-white p-8 shadow-[0_15px_40px_rgba(0,0,0,0.1)] md:p-12"
      >
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="First Name" required error={errors.firstName}>
              <input
                type="text"
                value={values.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                data-error={!!errors.firstName}
              />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <input
                type="text"
                value={values.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                data-error={!!errors.lastName}
              />
            </Field>
            <Field label="Date of Birth" required error={errors.dateOfBirth}>
              <input
                type="date"
                value={values.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                onBlur={() => setErrors((p) => ({ ...p, dateOfBirth: validateField("dateOfBirth", values.dateOfBirth) }))}
                data-error={!!errors.dateOfBirth}
              />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <select value={values.gender} onChange={(e) => set("gender", e.target.value)} data-error={!!errors.gender}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="National Identification Number (NIN)" hint="For tax benefits" error={errors.nin}>
              <input
                type="text"
                value={values.nin}
                maxLength={14}
                placeholder="e.g. CF98012103HGBV04"
                onChange={(e) => set("nin", e.target.value)}
                onBlur={() => setErrors((p) => ({ ...p, nin: validateField("nin", values.nin) }))}
                data-error={!!errors.nin}
              />
            </Field>
            <Field label="Phone Number" required error={errors.phoneNumber}>
              <input
                type="tel"
                value={values.phoneNumber}
                placeholder="+256..."
                onChange={(e) => set("phoneNumber", e.target.value)}
                onBlur={() => setErrors((p) => ({ ...p, phoneNumber: validateField("phoneNumber", values.phoneNumber) }))}
                data-error={!!errors.phoneNumber}
              />
            </Field>
            <Field label="Email Address" className="md:col-span-2" error={errors.email}>
              <input
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => setErrors((p) => ({ ...p, email: validateField("email", values.email) }))}
                data-error={!!errors.email}
              />
            </Field>
          </div>
        </div>

        {/* Product Selection */}
        <div className="form-section">
          <h3>Select Financial Product</h3>
          <Field label="Choose a Product" required error={errors.product}>
            <select
              value={values.product}
              onChange={(e) => {
                const key = e.target.value;
                set("product", key);
                const c = PRODUCTS[key];
                if (c) {
                  set("loanPurpose", c.purpose);
                  setErrors((p) => ({ ...p, loanAmount: "", loanPurpose: "" }));
                } else {
                  set("loanPurpose", "");
                }
              }}
              data-error={!!errors.product}
            >
              <option value="">Select a Product</option>
              {PRODUCT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {cfg && (
              <small className="field-hint">
                Allowed range: UGX {cfg.min.toLocaleString()} -{" "}
                {cfg.max.toLocaleString()}
              </small>
            )}
          </Field>
        </div>

        {/* Address Information */}
        <div className="form-section">
          <h3>Address Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Region" required error={errors.region}>
              <select
                value={values.region}
                onChange={(e) => {
                  set("region", e.target.value);
                  set("district", "");
                }}
                data-error={!!errors.region}
              >
                <option value="">Select Region</option>
                <option value="central">Central</option>
                <option value="eastern">Eastern</option>
                <option value="northern">Northern</option>
                <option value="western">Western</option>
              </select>
            </Field>
            <Field label="District" required error={errors.district}>
              <select
                value={values.district}
                onChange={(e) => set("district", e.target.value)}
                disabled={!values.region}
                data-error={!!errors.district}
              >
                <option value="">
                  {values.region ? "Select District" : "Select Region first"}
                </option>
                {districts.map((d) => (
                  <option key={d} value={d.toLowerCase().replace(/\s+/g, "_")}>
                    {d}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Sub-county" required error={errors.subcounty}>
              <input
                type="text"
                value={values.subcounty}
                onChange={(e) => set("subcounty", e.target.value)}
                data-error={!!errors.subcounty}
              />
            </Field>
            <Field label="Village" required error={errors.village}>
              <input
                type="text"
                value={values.village}
                onChange={(e) => set("village", e.target.value)}
                data-error={!!errors.village}
              />
            </Field>
          </div>
        </div>

        {/* Agricultural Information (Harvest Advance only) */}
        {cfg?.showAgri && (
          <div className="form-section">
            <h3>Agricultural Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Primary Crop" required error={errors.primaryCrop}>
                <select
                  value={values.primaryCrop}
                  onChange={(e) => set("primaryCrop", e.target.value)}
                  data-error={!!errors.primaryCrop}
                >
                  <option value="">Select Primary Crop</option>
                  <option value="coffee">Coffee</option>
                  <option value="maize">Maize</option>
                  <option value="beans">Beans</option>
                  <option value="rice">Rice</option>
                  <option value="groundnuts">Groundnuts</option>
                  <option value="cassava">Cassava</option>
                  <option value="sweet_potatoes">Sweet Potatoes</option>
                  <option value="bananas">Bananas</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Farm Size (Acres)" required error={errors.farmSize}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={values.farmSize}
                  onChange={(e) => set("farmSize", e.target.value)}
                  data-error={!!errors.farmSize}
                />
              </Field>
              <Field label="Annual Production (Kg)">
                <input
                  type="number"
                  min="0"
                  value={values.annualProduction}
                  onChange={(e) => set("annualProduction", e.target.value)}
                />
              </Field>
              <Field label="Years of Farming Experience">
                <input
                  type="number"
                  min="0"
                  value={values.farmingExperience}
                  onChange={(e) => set("farmingExperience", e.target.value)}
                />
              </Field>
              {values.primaryCrop === "other" && (
                <Field label="Specify Other Crop" error={errors.otherCrop}>
                  <input
                    type="text"
                    value={values.otherCrop}
                    onChange={(e) => set("otherCrop", e.target.value)}
                    data-error={!!errors.otherCrop}
                  />
                </Field>
              )}
            </div>
          </div>
        )}

        {/* Cooperative/Group Information (Asset / Value Chain) */}
        {cfg?.showCoop && (
          <div className="form-section">
            <h3>Cooperative/Group Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Cooperative/Group Name" required error={errors.cooperativeName}>
                <input
                  type="text"
                  value={values.cooperativeName}
                  onChange={(e) => set("cooperativeName", e.target.value)}
                  data-error={!!errors.cooperativeName}
                />
              </Field>
              <Field label="Membership Number">
                <input
                  type="text"
                  value={values.membershipNumber}
                  onChange={(e) => set("membershipNumber", e.target.value)}
                />
              </Field>
              <Field label="Position in Cooperative">
                <select value={values.position} onChange={(e) => set("position", e.target.value)}>
                  <option value="">Select Position</option>
                  <option value="chairperson">Chairperson</option>
                  <option value="secretary">Secretary</option>
                  <option value="treasurer">Treasurer</option>
                  <option value="committee_member">Committee Member</option>
                  <option value="ordinary_member">Ordinary Member</option>
                </select>
              </Field>
              <Field label="Cooperative Registration Number">
                <input
                  type="text"
                  value={values.registrationNumber}
                  onChange={(e) => set("registrationNumber", e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Financial Information */}
        <div className="form-section">
          <h3>Financial Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Requested Loan Amount (UGX)" required error={errors.loanAmount}>
              <input
                type="text"
                inputMode="numeric"
                value={values.loanAmount}
                onChange={(e) => set("loanAmount", formatCurrency(e.target.value))}
                onBlur={() => setErrors((p) => ({ ...p, loanAmount: validateField("loanAmount", values.loanAmount) }))}
                data-error={!!errors.loanAmount}
              />
              <small className="field-hint">
                {cfg
                  ? `Allowed range: UGX ${cfg.min.toLocaleString()} - ${cfg.max.toLocaleString()}`
                  : "Select a product to see allowed loan limits."}
              </small>
            </Field>
            <Field label="Loan Purpose" required error={errors.loanPurpose}>
              <select
                value={values.loanPurpose}
                onChange={(e) => set("loanPurpose", e.target.value)}
                data-error={!!errors.loanPurpose}
              >
                <option value="">Select Purpose</option>
                <option value="harvest_advance">Harvest Advance</option>
                <option value="asset_acquisition">Asset Acquisition</option>
                <option value="value_chain">Value Chain Financing</option>
                <option value="working_capital">Working Capital</option>
              </select>
            </Field>
            <Field label="Monthly Income (UGX)">
              <input
                type="text"
                inputMode="numeric"
                value={values.monthlyIncome}
                onChange={(e) => set("monthlyIncome", formatCurrency(e.target.value))}
              />
            </Field>
            <Field label="Do you have a bank account?" required error={errors.bankAccount}>
              <select
                value={values.bankAccount}
                onChange={(e) => set("bankAccount", e.target.value)}
                data-error={!!errors.bankAccount}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Consent and Declarations */}
        <div className="form-section">
          <h3>Consent and Declarations</h3>
          <Checkbox id="dataConsent" error={errors.dataConsent}>
            I consent to Daima Ventures processing my personal data for the
            purpose of loan assessment and as required by UMRA regulations.{" "}
            <span className="required">*</span>
          </Checkbox>
          <Checkbox id="creditCheck" error={errors.creditCheck}>
            I authorize Daima Ventures to conduct credit checks and verify
            information provided. <span className="required">*</span>
          </Checkbox>
          <Checkbox id="termsAccept" error={errors.termsAccept}>
            I have read and agree to the terms and conditions of Daima Ventures
            financial products. <span className="required">*</span>
          </Checkbox>
          <Checkbox id="accurateInfo" error={errors.accurateInfo}>
            I declare that all information provided is accurate and complete to
            the best of my knowledge. <span className="required">*</span>
          </Checkbox>
        </div>

        <div className="mt-4">
          <button type="submit" className="btn w-full" disabled={status === "submitting"}>
            {status === "submitting" ? "Processing Application..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`form-group ${className}`}>
      <label className="mb-1 block font-semibold text-[#2d4d78]">
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

function Checkbox({ id, error, children }: { id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={id}
          name={id}
          className="mt-1.5 h-4 w-4"
          data-error={!!error}
        />
        <label htmlFor={id} className="font-semibold text-[#2d4d78]">
          {children}
        </label>
      </div>
      {error && <div className="error-message ml-7">{error}</div>}
    </div>
  );
}
